import { isMerchantOrderStatus } from "@/lib/orders/merchant-status-constants";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry, withSupabaseReadRetryResult } from "@/lib/supabase/transient-retry";

export type MerchantOrderRow = {
  id: string;
  created_at: string;
  status: string;
  table_no: string | null;
  guest_note: string | null;
  total_price: number;
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
  return {
    id,
    created_at: created,
    status,
    table_no: typeof table_no === "string" && table_no.trim() ? table_no : null,
    guest_note: typeof guest_note === "string" && guest_note.trim() ? guest_note : null,
    total_price: total,
  };
}

export async function listOrdersForMerchant(
  tenantSlug: string,
  statusFilter?: string | null,
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

  const filter =
    statusFilter && typeof statusFilter === "string" && isMerchantOrderStatus(statusFilter.trim())
      ? statusFilter.trim()
      : null;

  const fetchRows = () => {
    let q = client
      .from("orders")
      .select("id, created_at, status, table_no, guest_note, total_price")
      .eq("tenant_slug", slug);
    if (filter) {
      q = q.eq("status", filter);
    }
    return q.order("created_at", { ascending: false }).limit(100);
  };

  const { data, error } = await withSupabaseReadRetry(() => fetchRows());

  if (error) {
    return { ok: false, message: error.message ?? error.code ?? "주문 목록을 불러오지 못했습니다." };
  }

  const rows: MerchantOrderRow[] = [];
  for (const r of data ?? []) {
    const row = parseRow(r as Record<string, unknown>);
    if (row) rows.push(row);
  }

  return { ok: true, rows };
}

/** `pending` 상태 주문만 집계(대기 뱃지·내비용). 실패 시 `null`. */
export async function countMerchantPendingOrders(tenantSlug: string): Promise<number | null> {
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
}

export type MerchantDashboard24hMetrics =
  | {
      ok: true;
      orderCount: number;
      totalSales: number;
      byStatus: Partial<Record<string, number>>;
    }
  | { ok: false; message: string };

/** 최근 24시간 주문 요약 (실사용 대시보드 카드용). */
export async function getMerchantDashboard24hMetrics(tenantSlug: string): Promise<MerchantDashboard24hMetrics> {
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

  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

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
