"use server";

import { submitGuestOrder, type GuestOrderLine } from "@/lib/orders/submit-guest-order";

function parseLines(raw: unknown): GuestOrderLine[] | null {
  if (!Array.isArray(raw)) return null;
  const out: GuestOrderLine[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const o = entry as Record<string, unknown>;
    const id = o.id;
    const name = o.name;
    const price = o.price;
    const quantity = o.quantity;
    if (typeof id !== "string" || typeof name !== "string") return null;
    const p = typeof price === "number" ? price : Number(price);
    const q = typeof quantity === "number" ? quantity : Number(quantity);
    if (!Number.isFinite(p) || !Number.isFinite(q) || q < 1 || q > 99) return null;
    const notes = o.notes;
    out.push({
      id,
      name,
      price: p,
      quantity: Math.floor(q),
      notes: typeof notes === "string" ? notes : notes == null ? null : String(notes),
    });
  }
  return out;
}

export async function submitGuestOrderAction(
  tenant: string,
  linesJson: string,
  guestSessionId: string | null,
  tableNo: string | null,
  guestNote: string | null,
): Promise<
  | { ok: true; orderId: string }
  | { ok: false; message: string }
> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(linesJson) as unknown;
  } catch {
    return { ok: false, message: "주문 데이터 형식이 올바르지 않습니다." };
  }

  const lines = parseLines(parsed);
  if (!lines) {
    return { ok: false, message: "주문 품목이 올바르지 않습니다." };
  }

  return submitGuestOrder({
    tenant,
    lines,
    guestSessionId: guestSessionId?.trim() || null,
    tableNo: tableNo?.trim() || null,
    guestNote: guestNote?.trim() || null,
  });
}
