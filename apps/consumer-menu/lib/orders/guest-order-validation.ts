/** 장바구니에서 넘어오는 한 줄(서버에서 다시 검증). */
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

/** 제어 문자(탭·개행 제외) — id·이름에만 적용 */
function hasDisallowedControls(s: string): boolean {
  return /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(s);
}

/**
 * 장바구니 JSON을 DB·RLS에 맞게 정리합니다.
 * 실패 시 사용자에게 보일 짧은 한국어 메시지를 돌려줍니다.
 */
export function sanitizeGuestOrderLines(
  lines: GuestOrderLine[],
): { ok: true; items: SanitizedGuestLine[] } | { ok: false; message: string } {
  const L = GUEST_ORDER_LIMITS;

  if (lines.length === 0) {
    return { ok: false, message: "담은 메뉴가 없습니다." };
  }
  if (lines.length > L.maxLineItems) {
    return { ok: false, message: `한 주문에는 메뉴를 최대 ${L.maxLineItems}개까지 담을 수 있습니다.` };
  }

  const items: SanitizedGuestLine[] = [];

  for (const item of lines) {
    const id = String(item.id).trim().slice(0, L.maxMenuIdLen);
    const name = String(item.name).trim().slice(0, L.maxMenuNameLen);
    if (!id || !name) {
      return { ok: false, message: "메뉴 정보가 올바르지 않습니다." };
    }
    if (hasDisallowedControls(id) || hasDisallowedControls(name)) {
      return { ok: false, message: "메뉴 정보가 올바르지 않습니다." };
    }

    const price = typeof item.price === "number" ? item.price : Number(item.price);
    const qtyRaw = typeof item.quantity === "number" ? item.quantity : Number(item.quantity);
    const quantity = Math.floor(qtyRaw);

    if (!Number.isFinite(price) || price < 0 || price > L.maxUnitPrice) {
      return { ok: false, message: "가격 정보가 올바르지 않습니다." };
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, message: "수량이 올바르지 않습니다." };
    }

    let notes: string | null = null;
    if (item.notes != null) {
      const n = String(item.notes).trim().slice(0, L.maxLineNoteLen);
      if (n) {
        if (hasDisallowedControls(n)) {
          return { ok: false, message: "요청 메모 형식이 올바르지 않습니다." };
        }
        notes = n;
      }
    }

    items.push({ id, name, price, quantity, notes });
  }

  const total = items.reduce((sum, row) => sum + row.price * row.quantity, 0);
  if (!Number.isFinite(total) || total < 0 || total > L.maxTotalPrice) {
    return { ok: false, message: "주문 합계가 허용 범위를 넘습니다." };
  }

  return { ok: true, items };
}

export function sanitizeTenantSlug(raw: string): { ok: true; slug: string } | { ok: false; message: string } {
  const slug = raw.trim();
  const max = GUEST_ORDER_LIMITS.maxTenantSlugLen;
  if (!slug) {
    return { ok: false, message: "유효한 가게 정보가 없습니다." };
  }
  if (slug.length > max) {
    return { ok: false, message: "유효한 가게 정보가 없습니다." };
  }
  if (hasDisallowedControls(slug)) {
    return { ok: false, message: "유효한 가게 정보가 없습니다." };
  }
  return { ok: true, slug };
}

export function sanitizeGuestSessionId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim().slice(0, GUEST_ORDER_LIMITS.maxGuestSessionLen);
  if (!s || hasDisallowedControls(s)) return null;
  return s;
}
