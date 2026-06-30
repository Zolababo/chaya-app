"use server";

import type { GuestOrderErrorCode, GuestOrderErrorParams } from "@/lib/i18n/guest-order-error-codes";
import type { GuestOrderLine } from "@/lib/orders/guest-order-validation";
import { GUEST_ORDER_LIMITS } from "@/lib/orders/guest-order-validation";
import { submitGuestOrder } from "@/lib/orders/submit-guest-order";
import {
  GUEST_ORDER_RATE_IP_MAX,
  GUEST_ORDER_RATE_IP_WINDOW_MS,
  GUEST_ORDER_RATE_SESSION_MAX,
} from "@/lib/security/guest-order-rate-limit";
import { isRateLimited, rateLimitKeyFromHeaders } from "@/lib/security/simple-rate-limit";

function parseLines(raw: unknown): GuestOrderLine[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length > GUEST_ORDER_LIMITS.maxLineItems) return null;
  const out: GuestOrderLine[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const o = entry as Record<string, unknown>;
    const id = o.id;
    const name = o.name;
    const price = o.unitPrice ?? o.price;
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

const MAX_LINES_JSON_CHARS = 2_000_000;

export type SubmitGuestOrderActionResult =
  | { ok: true; orderId: string; orderNo: number | null }
  | { ok: false; code: GuestOrderErrorCode; params?: GuestOrderErrorParams };

export async function submitGuestOrderAction(
  tenant: string,
  linesJson: string,
  guestSessionId: string | null,
  tableNo: string | null,
  guestNote: string | null,
  tableQrExp: number | null,
  tableQrSig: string | null,
): Promise<SubmitGuestOrderActionResult> {
  const slug = tenant.trim();
  const ipKey = await rateLimitKeyFromHeaders(`guest-order:${slug}`);
  if (isRateLimited(ipKey, GUEST_ORDER_RATE_IP_MAX, GUEST_ORDER_RATE_IP_WINDOW_MS)) {
    return { ok: false, code: "rate_limit" };
  }

  const sid = guestSessionId?.trim() || "";
  if (sid.length >= 8) {
    const sessionKey = `guest-order:${slug}:sess:${sid.slice(0, 64)}`;
    if (isRateLimited(sessionKey, GUEST_ORDER_RATE_SESSION_MAX, GUEST_ORDER_RATE_IP_WINDOW_MS)) {
      return { ok: false, code: "rate_limit" };
    }
  }

  if (linesJson.length > MAX_LINES_JSON_CHARS) {
    return { ok: false, code: "payload_too_large" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(linesJson) as unknown;
  } catch {
    return { ok: false, code: "payload_invalid" };
  }

  const lines = parseLines(parsed);
  if (!lines) {
    return { ok: false, code: "lines_invalid" };
  }

  return submitGuestOrder({
    tenant,
    lines,
    guestSessionId: sid || null,
    tableNo: tableNo?.trim() || null,
    guestNote: guestNote?.trim() || null,
    tableQrExp,
    tableQrSig: tableQrSig?.trim() || null,
  });
}
