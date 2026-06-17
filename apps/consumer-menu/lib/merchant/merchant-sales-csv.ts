import "server-only";

import { getKstCalendarDayBounds } from "@/lib/orders/merchant-analytics";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

export const MERCHANT_SALES_CSV_MAX_ROWS = 5000;

export type MerchantSalesExportRow = {
  createdAt: string;
  orderNo: number | null;
  status: string;
  tableNo: string | null;
  totalPrice: number;
  itemCount: number;
};

export type FetchMerchantSalesExportResult =
  | { ok: true; rows: MerchantSalesExportRow[]; truncated: boolean }
  | { ok: false; message: string };

function parsePrice(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function countItems(raw: unknown): number {
  if (!Array.isArray(raw)) return 0;
  return raw.length;
}

export async function fetchMerchantSalesForExport(
  tenantSlug: string,
  days = 30,
): Promise<FetchMerchantSalesExportResult> {
  const tenant = tenantSlug.trim();
  if (!tenant) {
    return { ok: false, message: "매장 정보가 없습니다." };
  }

  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "서버 설정이 없습니다." };
  }

  const span = Math.min(90, Math.max(1, Math.floor(days)));
  const { sinceIso } = getKstCalendarDayBounds(Date.now() - (span - 1) * 86400000);

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("created_at, order_no, status, table_no, total_price, items_json")
      .eq("tenant_slug", tenant)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(MERCHANT_SALES_CSV_MAX_ROWS + 1),
  );

  if (error) {
    return { ok: false, message: error.message ?? "주문 내역을 불러오지 못했습니다." };
  }

  const all = data ?? [];
  const truncated = all.length > MERCHANT_SALES_CSV_MAX_ROWS;
  const slice = truncated ? all.slice(0, MERCHANT_SALES_CSV_MAX_ROWS) : all;

  const rows: MerchantSalesExportRow[] = slice.map((row) => {
    const rec = row as Record<string, unknown>;
    return {
      createdAt: typeof rec.created_at === "string" ? rec.created_at : "",
      orderNo: typeof rec.order_no === "number" ? rec.order_no : null,
      status: typeof rec.status === "string" ? rec.status : "",
      tableNo: typeof rec.table_no === "string" ? rec.table_no : null,
      totalPrice: parsePrice(rec.total_price),
      itemCount: countItems(rec.items_json),
    };
  });

  return { ok: true, rows, truncated };
}

export function buildMerchantSalesCsv(rows: MerchantSalesExportRow[]): string {
  const header = ["created_at", "order_no", "status", "table_no", "total_price", "item_count"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        csvEscape(row.createdAt),
        row.orderNo != null ? String(row.orderNo) : "",
        csvEscape(row.status),
        csvEscape(row.tableNo ?? ""),
        String(row.totalPrice),
        String(row.itemCount),
      ].join(","),
    );
  }
  return `\uFEFF${lines.join("\n")}\n`;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
