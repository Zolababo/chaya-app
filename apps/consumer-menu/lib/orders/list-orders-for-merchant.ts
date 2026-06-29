import { cache } from "react";

import {
  buildGuestOrderContexts,
  type MerchantGuestOrderContext,
} from "@/lib/merchant/guest-order-context";
import { parseOrderNoField } from "@/lib/orders/format-order-no";
import {
  parseOrderLineSummaries,
  type OrderLineSummary,
} from "@/lib/orders/format-order-line-summary";
import { sanitizeGuestSessionId } from "@/lib/orders/guest-order-validation";
import { getTenantCurrentBusinessDayBounds } from "@/lib/merchant/resolve-tenant-analytics-bounds";
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
  /** `completed` — 이번 영업일 결제완료(`completed_at`). 그 외 — 영업일 접수(`created_at`). */
  todayKst?: boolean;
};

export type MerchantOrderRow = {
  id: string;
  order_no: number | null;
  created_at: string;
  status: string;
  table_no: string | null;
  table_session_id: string | null;
  guest_note: string | null;
  cancel_reason: string | null;
  total_price: number;
  lines: OrderLineSummary[];
  /** 익명 손님 — guest_session_id 는 서버에서만 사용 */
  guestContext?: MerchantGuestOrderContext | null;
};

type MerchantOrderRowInternal = MerchantOrderRow & {
  guest_session_id: string | null;
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

function parseRow(raw: Record<string, unknown>): MerchantOrderRowInternal | null {
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
  const table_session_id = raw.table_session_id;
  return {
    id,
    order_no: parseOrderNoField(raw.order_no),
    created_at: created,
    status,
    table_no: typeof table_no === "string" && table_no.trim() ? table_no : null,
    table_session_id:
      typeof table_session_id === "string" && table_session_id.trim()
        ? table_session_id.trim()
        : null,
    guest_note: typeof guest_note === "string" && guest_note.trim() ? guest_note : null,
    cancel_reason:
      typeof cancel_reason === "string" && cancel_reason.trim() ? cancel_reason.trim() : null,
    total_price: total,
    lines: parseOrderLineSummaries(raw.items),
    guest_session_id: sanitizeGuestSessionId(
      typeof raw.guest_session_id === "string" ? raw.guest_session_id : null,
    ),
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

  const todayBounds = todayKst ? await getTenantCurrentBusinessDayBounds(slug) : null;

  const buildQuery = (withCancelReason: boolean, withCompletedAt: boolean) => {
    const baseCols = withCancelReason
      ? "id, order_no, created_at, status, table_no, table_session_id, guest_note, cancel_reason, total_price, items, guest_session_id"
      : "id, order_no, created_at, status, table_no, table_session_id, guest_note, total_price, items, guest_session_id";
    const cols = withCompletedAt ? `${baseCols}, completed_at` : baseCols;
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
    if (todayKst && todayBounds) {
      const { sinceIso, untilIso } = todayBounds;
      if (statusFilter === "completed" && withCompletedAt) {
        q = q.or(
          `and(completed_at.gte.${sinceIso},completed_at.lt.${untilIso}),and(completed_at.is.null,created_at.gte.${sinceIso},created_at.lt.${untilIso})`,
        );
      } else {
        q = q.gte("created_at", sinceIso).lt("created_at", untilIso);
      }
    }
    const activeQueue =
      bucketFilter === "cooking" ||
      bucketFilter === "in_progress" ||
      bucketFilter === "all_active" ||
      statusFilter === "pending" ||
      statusFilter === "ready";
    const paidToday = todayKst && statusFilter === "completed";
    const orderCol = paidToday && withCompletedAt ? "completed_at" : "created_at";
    return q.order(orderCol, { ascending: activeQueue }).limit(100);
  };

  let data: unknown[] | null = null;
  let error: { message?: string; code?: string } | null = null;

  {
    const first = await withSupabaseReadRetry(() => buildQuery(true, true));
    data = (first.data as unknown[] | null) ?? null;
    error = first.error;
    if (error && /cancel_reason|column.*does not exist/i.test(error.message ?? "")) {
      const second = await withSupabaseReadRetry(() => buildQuery(false, true));
      data = (second.data as unknown[] | null) ?? null;
      error = second.error;
    }
    if (error && /completed_at|column.*does not exist/i.test(error.message ?? "")) {
      const third = await withSupabaseReadRetry(() => buildQuery(true, false));
      data = (third.data as unknown[] | null) ?? null;
      error = third.error;
      if (error && /cancel_reason|column.*does not exist/i.test(error.message ?? "")) {
        const fourth = await withSupabaseReadRetry(() => buildQuery(false, false));
        data = (fourth.data as unknown[] | null) ?? null;
        error = fourth.error;
      }
    }
  }

  // guest_session_id / table_session_id 컬럼 미적용 DB 폴백
  if (error && /guest_session_id|table_session_id|column.*does not exist/i.test(error.message ?? "")) {
    const buildWithoutGuest = (withCancel: boolean) => {
      const cols = withCancel
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
      if (todayKst && todayBounds) {
        const { sinceIso, untilIso } = todayBounds;
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
    const first = await withSupabaseReadRetry(() => buildWithoutGuest(true));
    data = (first.data as unknown[] | null) ?? null;
    error = first.error;
    if (error && /cancel_reason|column.*does not exist/i.test(error.message ?? "")) {
      const second = await withSupabaseReadRetry(() => buildWithoutGuest(false));
      data = (second.data as unknown[] | null) ?? null;
      error = second.error;
    }
  }

  if (error) {
    return { ok: false, message: error.message ?? error.code ?? "주문 목록을 불러오지 못했습니다." };
  }

  const internal: MerchantOrderRowInternal[] = [];
  for (const r of (data as unknown[]) ?? []) {
    const row = parseRow(r as Record<string, unknown>);
    if (row) internal.push(row);
  }

  const guestContexts = await buildGuestOrderContexts(
    slug,
    internal.map((r) => ({
      id: r.id,
      guest_session_id: r.guest_session_id,
      status: r.status,
    })),
  );

  const rows: MerchantOrderRow[] = internal.map(({ guest_session_id: _sid, ...rest }) => ({
    ...rest,
    guestContext: guestContexts.get(rest.id) ?? null,
  }));

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
