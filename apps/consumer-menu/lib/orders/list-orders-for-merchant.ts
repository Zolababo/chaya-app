import { isMerchantOrderStatus } from "@/lib/orders/merchant-status-constants";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

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

  let query = client
    .from("orders")
    .select("id, created_at, status, table_no, guest_note, total_price")
    .eq("tenant_slug", slug);
  if (filter) {
    query = query.eq("status", filter);
  }
  const { data, error } = await query.order("created_at", { ascending: false }).limit(100);

  if (error) {
    return { ok: false, message: error.message };
  }

  const rows: MerchantOrderRow[] = [];
  for (const r of data ?? []) {
    const row = parseRow(r as Record<string, unknown>);
    if (row) rows.push(row);
  }

  return { ok: true, rows };
}
