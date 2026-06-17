import { cache } from "react";

import { parseOrderNoField } from "@/lib/orders/format-order-no";
import {
  parseOrderLineSummaries,
  type OrderLineSummary,
} from "@/lib/orders/format-order-line-summary";
import { getKstCalendarDayBounds } from "@/lib/orders/merchant-analytics";
import {
  isMerchantOrderListBucket,
  isMerchantOrderStatus,
  MERCHANT_COOKING_STATUSES,
  MERCHANT_IN_PROGRESS_STATUSES,
  type MerchantOrderStatus,
} from "@/lib/orders/merchant-status-constants";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry, withSupabaseReadRetryResult } from "@/lib/supabase/transient-retry";

export type ListMerchantOrdersQuery = {
  status?: MerchantOrderStatus | null;
  bucket?: "in_progress" | "cooking" | "all_active" | null;
  /** `completed`·`cancelled` 등 — KST 당일 접수만. */
  todayKst?: boolean;
};

export type MerchantOrderRow = {
  id: string;
  order_no: number | null;
  created_at: string;
  status: string;
  table_no: string | null;
  guest_note: string | null;
  cancel_reason: string | null;
  total_price: number;
  lines: OrderLineSummary[];
};

export type ListMerchantOrdersResult =
  | { ok: true; rows: MerchantOrderRow[] }
  | { ok: false; message: string };

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseRow(raw: Record<string, unknown>): MerchantOrderRow | null {
  const id = raw.id;
  const created_at = raw.created_at;
  const status = raw.status;
  if (typeof id !== "string" || typeof status !== "string") return null;
  const created =
    typeof created_at === "string"
      ? created_at
      : created_at instanceof Date
        ? created_at.toISOString()
        : "";
  if (!created) return null;
  const total = num(raw.total_price);
  if (total == null) return null;
  const table_no = raw.table_no;
  const guest_note = raw.guest_note;
  const cancel_reason = raw.cancel_reason;
  return {
    id,
    order_no: parseOrderNoField(raw.order_no),
    created_at: created,
    status,
    table_no: typeof table_no === "string" && table_no.trim() ? table_no : null,
    guest_note: typeof guest_note === "string" && guest_note.trim() ? guest_note : null,
    cancel_reason:
      typeof cancel_reason === "string" && cancel_reason.trim() ? cancel_reason.trim() : null,
    total_price: total,
    lines: parseOrderLineSummaries(raw.items),
  };
}

function normalizeListQuery(
  query?: string | null | ListMerchantOrdersQuery,
): ListMerchantOrdersQuery {
  if (query == null) return {};
  if (typeof query === "string") {
    const s = query.trim();
    return isMerchantOrderStatus(s) ? { status: s } : {};
  }
  return query;
}

export async function listOrdersForMerchant(
  tenantSlug: string,
  query?: string | null | ListMerchantOrdersQuery,
): Promise<ListMerchantOrdersResult> {
  const slug = tenantSlug.trim();
  if (!slug) {
    return { ok: false, message: "테넌트가 없습니다." };
  }

  const client = createServiceSupabase();
  if (!client) {
    return {
      ok: false,
      message:
        "Supabase 서버 접속 설정이 없습니다. Vercel Production에 SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_SECRET_KEY)와 NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_URL 을 넣고 재배포해 주세요.",
    };
  }

  const { status: statusFilter, bucket, todayKst } = normalizeListQuery(query);
  const bucketFilter =
    bucket && isMerchantOrderListBucket(bucket) ? bucket : null;

  const buildQuery = (withCancelReason: boolean) => {
    const cols = withCancelReason
      ? "id, order_no, created_at, status, table_no, guest_note, cancel_reason, total_price, items"
      : "id, order_no, created_at, status, table_no, guest_note, total_price, items";
    let q = client.from("orders").select(cols).eq("tenant_slug", slug);
    if (bucketFilter === "cooking") {
      q = q.in("status", [...MERCHANT_COOKING_STATUSES]);
    } else if (bucketFilter === "in_progress") {
      q = q.in("status", [...MERCHANT_IN_PROGRESS_STATUSES]);
    } else if (bucketFilter === "all_active") {
      q = q.in("status", ["pending", "accepted", "preparing", "ready"]);
    } else if (statusFilter) {
      q = q.eq("status", statusFilter);
    }
    if (todayKst) {
      const { sinceIso, untilIso } = getKstCalendarDayBounds();
      q = q.gte("created_at", sinceIso).lt("created_at", untilIso);
    }
    const activeQueue =
      bucketFilter === "cooking" ||
      bucketFilter === "in_progress" ||
      bucketFilter === "all_active" ||
      statusFilter === "pending" ||
      statusFilter === "ready";
    return q.order("created_at", { ascending: activeQueue }).limit(100);
  };

  let { data, error } = await withSupabaseReadRetry(() => buildQuery(true));

  // cancel_reason 컬럼이 아직 DB에 없을 때(마이그레이션 미적용) 폴백
  if (error && /cancel_reason|column.*does not exist/i.test(error.message ?? "")) {
    ({ data, error } = await withSupabaseReadRetry(() => buildQuery(false)));
  }

  if (error) {
    return { ok: false, message: error.message ?? error.code ?? "주문 목록을 불러오지 못했습니다." };
  }

  const rows: MerchantOrderRow[] = [];
  for (const r of (data as unknown[]) ?? []) {
    const row = parseRow(r as Record<string, unknown>);
    if (row) rows.push(row);
  }

  return { ok: true, rows };
}

/** `pending` 상태 주문만 집계(대기 뱃지·내비용). 실패 시 `null`. 요청당 1회. */
export const countMerchantPendingOrders = cache(async function countMerchantPendingOrders(
  tenantSlug: string,
): Promise<number | null> {
  const slug = tenantSlug.trim();
  if (!slug) return null;

  const client = createServiceSupabase();
  if (!client) return null;

  const { error, count } = await withSupabaseReadRetryResult(() =>
    client
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("tenant_slug", slug)
      .eq("status", "pending"),
  );

  if (error) return null;
  return count ?? 0;
});

export type MerchantDashboard24hMetrics =
  | {
      ok: true;
      orderCount: number;
      totalSales: number;
      byStatus: Partial<Record<string, number>>;
    }
  | { ok: false; message: string };

/** 최근 N일(롤링 24h×N) 주문 요약. N=1 이면 대시보드 24시간 카드와 동일 스케일. */
export async function getMerchantOrderMetricsSinceDays(
  tenantSlug: string,
  days: number,
): Promise<MerchantDashboard24hMetrics> {
  const slug = tenantSlug.trim();
  if (!slug) {
    return { ok: false, message: "테넌트가 없습니다." };
  }

  const client = createServiceSupabase();
  if (!client) {
    return {
      ok: false,
      message:
        "Supabase 서버 접속 설정이 없습니다. Vercel Production에 SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_SECRET_KEY)와 NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_URL 을 넣고 재배포해 주세요.",
    };
  }

  const d = Math.min(90, Math.max(1, Math.floor(Number(days)) || 1));
  const sinceIso = new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("total_price, status")
      .eq("tenant_slug", slug)
      .gte("created_at", sinceIso),
  );

  if (error) {
    return { ok: false, message: error.message ?? error.code ?? "주문 통계를 불러오지 못했습니다." };
  }

  const rows = data ?? [];
  let totalSales = 0;
  const byStatus: Partial<Record<string, number>> = {};

  for (const r of rows) {
    const rawPrice = r.total_price;
    const p =
      typeof rawPrice === "number" ? rawPrice : typeof rawPrice === "string" ? Number(rawPrice) : NaN;
    if (Number.isFinite(p)) totalSales += p;

    const st = typeof r.status === "string" ? r.status : "";
    if (st) {
      byStatus[st] = (byStatus[st] ?? 0) + 1;
    }
  }

  return { ok: true, orderCount: rows.length, totalSales, byStatus };
}

/** 최근 24시간 주문 요약 (롤링). 홈 대시보드는 `getMerchantTodayKstMetrics` 사용. */
export async function getMerchantDashboard24hMetrics(tenantSlug: string): Promise<MerchantDashboard24hMetrics> {
  return getMerchantOrderMetricsSinceDays(tenantSlug, 1);
}
