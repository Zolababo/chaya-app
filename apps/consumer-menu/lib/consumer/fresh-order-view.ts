/** 주문 직후 1회 — 완료 안내 + 영수증 카드 */

type FreshOrderPayload = {
  orderId: string;
  orderNo: number | null;
};

function storageKey(tenant: string): string {
  return `chaya_fresh_order_view_v1:${encodeURIComponent(tenant.trim())}`;
}

export function markFreshOrderView(
  tenant: string,
  orderId: string,
  orderNo?: number | null,
): void {
  if (typeof window === "undefined") return;
  const payload: FreshOrderPayload = {
    orderId: orderId.trim(),
    orderNo:
      typeof orderNo === "number" && Number.isFinite(orderNo) && orderNo > 0
        ? Math.trunc(orderNo)
        : null,
  };
  try {
    sessionStorage.setItem(storageKey(tenant), JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/** 상세 페이지 최초 진입 시 — 키는 바로 삭제 */
export function consumeFreshOrderView(
  tenant: string,
  orderId: string,
): { fresh: boolean; orderNo: number | null } {
  const miss = { fresh: false, orderNo: null as number | null };
  if (typeof window === "undefined") return miss;
  try {
    const key = storageKey(tenant);
    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    if (!raw) return miss;

    const id = orderId.trim();
    if (raw === id) return { fresh: true, orderNo: null };

    let parsed: FreshOrderPayload;
    try {
      parsed = JSON.parse(raw) as FreshOrderPayload;
    } catch {
      return { fresh: raw === id, orderNo: null };
    }
    if (parsed.orderId !== id) return miss;
    const n = parsed.orderNo;
    const orderNo =
      typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
    return { fresh: true, orderNo };
  } catch {
    return miss;
  }
}
