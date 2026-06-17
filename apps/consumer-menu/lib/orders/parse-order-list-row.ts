import type { GuestOrderLineView } from "@/lib/orders/fetch-guest-order";
import { parseOrderNoField } from "@/lib/orders/format-order-no";
import type { GuestOrderListItem } from "@/lib/orders/list-guest-orders";

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function coerceItemsArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeLines(raw: unknown): GuestOrderLineView[] {
  const out: GuestOrderLineView[] = [];
  for (const row of coerceItemsArray(raw)) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const menuId = typeof o.id === "string" ? o.id.trim() : null;
    const name =
      typeof o.name === "string"
        ? o.name.trim()
        : typeof o.menu_name === "string"
          ? o.menu_name.trim()
          : null;
    const qty = num(o.quantity) ?? num(o.qty);
    const price = num(o.price) ?? num(o.unit_price) ?? num(o.unitPrice);
    if (!name || qty == null || price == null) continue;
    const quantity = Math.max(1, Math.floor(qty));
    out.push({
      ...(menuId ? { menuId } : {}),
      name,
      quantity,
      price,
    });
  }
  return out;
}

/** `list_orders_for_guest` / `list_orders_for_user` RPC 행 → 목록 카드용 */
export function parseOrderListRow(raw: unknown): GuestOrderListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  const total = num(o.total_price);
  if (!id || total == null) return null;
  const created =
    typeof o.created_at === "string"
      ? o.created_at
      : o.created_at instanceof Date
        ? o.created_at.toISOString()
        : null;
  const st = o.status;
  const status = typeof st === "string" && st.trim() ? st.trim() : "pending";
  const lines = normalizeLines(o.items);
  return {
    id,
    order_no: parseOrderNoField(o.order_no),
    total_price: total,
    created_at: created,
    status,
    lines,
  };
}
