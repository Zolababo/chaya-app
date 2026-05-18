/** 장바구니에서 넘어오는 한 줄(서버에서 다시 검증). */
import type { GuestOrderErrorCode, GuestOrderErrorParams } from "@/lib/i18n/guest-order-error-codes";

export type GuestOrderLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string | null;
};

/** `orders` RLS `orders_guest_insert` 와 맞춥니다. */
export const GUEST_ORDER_LIMITS = {
  maxLineItems: 200,
  maxTotalPrice: 100_000_000,
  maxUnitPrice: 100_000_000,
  maxMenuIdLen: 128,
  maxMenuNameLen: 200,
  maxLineNoteLen: 500,
  maxTenantSlugLen: 120,
  maxGuestSessionLen: 128,
} as const;

export type SanitizedGuestLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
};

export type GuestOrderValidationFail = {
  ok: false;
  code: GuestOrderErrorCode;
  params?: GuestOrderErrorParams;
};

/** 제어 문자(탭·개행 제외) — id·이름에만 적용 */
function hasDisallowedControls(s: string): boolean {
  return /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(s);
}

/**
 * 장바구니 JSON을 DB·RLS에 맞게 정리합니다.
 * 실패 시 코드를 돌려주고, 클라이언트에서 locale 메시지로 변환합니다.
 */
export function sanitizeGuestOrderLines(
  lines: GuestOrderLine[],
): { ok: true; items: SanitizedGuestLine[] } | GuestOrderValidationFail {
  const L = GUEST_ORDER_LIMITS;

  if (lines.length === 0) {
    return { ok: false, code: "empty_cart" };
  }
  if (lines.length > L.maxLineItems) {
    return { ok: false, code: "too_many_items", params: { max: String(L.maxLineItems) } };
  }

  const items: SanitizedGuestLine[] = [];

  for (const item of lines) {
    const id = String(item.id).trim().slice(0, L.maxMenuIdLen);
    const name = String(item.name).trim().slice(0, L.maxMenuNameLen);
    if (!id || !name) {
      return { ok: false, code: "invalid_line" };
    }
    if (hasDisallowedControls(id) || hasDisallowedControls(name)) {
      return { ok: false, code: "invalid_line" };
    }

    const price = typeof item.price === "number" ? item.price : Number(item.price);
    const qtyRaw = typeof item.quantity === "number" ? item.quantity : Number(item.quantity);
    const quantity = Math.floor(qtyRaw);

    if (!Number.isFinite(price) || price < 0 || price > L.maxUnitPrice) {
      return { ok: false, code: "invalid_price" };
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, code: "invalid_qty" };
    }

    let notes: string | null = null;
    if (item.notes != null) {
      const n = String(item.notes).trim().slice(0, L.maxLineNoteLen);
      if (n) {
        if (hasDisallowedControls(n)) {
          return { ok: false, code: "invalid_note" };
        }
        notes = n;
      }
    }

    items.push({ id, name, price, quantity, notes });
  }

  const total = items.reduce((sum, row) => sum + row.price * row.quantity, 0);
  if (!Number.isFinite(total) || total < 0 || total > L.maxTotalPrice) {
    return { ok: false, code: "invalid_total" };
  }

  return { ok: true, items };
}

export function sanitizeTenantSlug(
  raw: string,
): { ok: true; slug: string } | GuestOrderValidationFail {
  const slug = raw.trim();
  const max = GUEST_ORDER_LIMITS.maxTenantSlugLen;
  if (!slug) {
    return { ok: false, code: "invalid_tenant" };
  }
  if (slug.length > max) {
    return { ok: false, code: "invalid_tenant" };
  }
  if (hasDisallowedControls(slug)) {
    return { ok: false, code: "invalid_tenant" };
  }
  return { ok: true, slug };
}

export function sanitizeGuestSessionId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim().slice(0, GUEST_ORDER_LIMITS.maxGuestSessionLen);
  if (!s || hasDisallowedControls(s)) return null;
  return s;
}
