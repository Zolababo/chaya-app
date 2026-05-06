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
    return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY 또는 URL 이 설정되지 않았습니다." };
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
