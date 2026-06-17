/** 미확인 주문 알림 — 하단 「주문내역」 탭 빨간 뱃지 (총 주문 건수 아님) */
export const CHAYA_ORDERS_COUNT_EVENT = "chaya-orders-count-changed";

export type OrdersCountDetail = {
  tenant: string;
  count: number;
};

export function ordersUnreadStorageKey(tenant: string): string {
  return `chaya_orders_unread_v1:${encodeURIComponent(tenant.trim())}`;
}

/** @deprecated 호환 — `ordersUnreadStorageKey` 사용 */
export const ordersCountStorageKey = ordersUnreadStorageKey;

export function readOrdersUnreadBadge(tenant: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(ordersUnreadStorageKey(tenant));
    const n = raw != null ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? Math.min(99, n) : 0;
  } catch {
    return 0;
  }
}

/** @deprecated — `readOrdersUnreadBadge` */
export const readOrdersCountCache = readOrdersUnreadBadge;

function writeOrdersUnreadBadge(tenant: string, count: number): void {
  const n = Math.max(0, Math.min(99, count));
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(ordersUnreadStorageKey(tenant), String(n));
    } catch {
      /* ignore */
    }
  }
  dispatchOrdersCount(tenant, n);
}

/** 주문 접수 직후 — 목록을 열기 전에도 탭에 표시 */
export function incrementOrdersUnreadBadge(tenant: string, by = 1): number {
  const next = readOrdersUnreadBadge(tenant) + Math.max(1, by);
  writeOrdersUnreadBadge(tenant, next);
  return next;
}

/** @deprecated — `incrementOrdersUnreadBadge` */
export const incrementOrdersCountCache = incrementOrdersUnreadBadge;

/** 주문내역 탭·QR 재진입 시 */
export function clearOrdersUnreadBadge(tenant: string): void {
  writeOrdersUnreadBadge(tenant, 0);
}

export function dispatchOrdersCount(tenant: string, count: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OrdersCountDetail>(CHAYA_ORDERS_COUNT_EVENT, {
      detail: { tenant: tenant.trim(), count: Math.max(0, Math.min(99, count)) },
    }),
  );
}
