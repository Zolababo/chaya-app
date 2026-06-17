import type { GuestOrderListItem } from "@/lib/orders/list-guest-orders";

const KST = "Asia/Seoul";

function kstDateKeyFromMs(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: KST });
}

function kstDateKeyFromIso(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return kstDateKeyFromMs(t);
}

/** 주문 접수 시각이 KST 기준 오늘인지 */
export function isConsumerOrderKstToday(iso: string | null, nowMs = Date.now()): boolean {
  const key = kstDateKeyFromIso(iso);
  if (!key) return false;
  return key === kstDateKeyFromMs(nowMs);
}

export function isCancelledConsumerOrderStatus(status: string): boolean {
  return status.trim().toLowerCase() === "cancelled";
}

export function isCompletedConsumerOrderStatus(status: string): boolean {
  return status.trim().toLowerCase() === "completed";
}

/**
 * 당일(KST) 결제완료(completed) 주문이 하나라도 있으면 방문 종료로 간주.
 * 같은 방문·세션의 취소 안내는 더 이상 보이지 않습니다.
 */
export function visitClosedByPaymentToday(
  allOrders: GuestOrderListItem[],
  nowMs = Date.now(),
): boolean {
  return allOrders.some(
    (o) =>
      isCompletedConsumerOrderStatus(o.status) && isConsumerOrderKstToday(o.created_at, nowMs),
  );
}

/**
 * 손님 주문내역 — 취소 카드 노출 조건:
 * - KST 당일 접수 취소만
 * - 당일 결제완료(방문 종료) 전까지만
 */
export function shouldShowCancelledConsumerOrder(
  order: GuestOrderListItem,
  allOrders: GuestOrderListItem[],
  nowMs = Date.now(),
): boolean {
  if (!isCancelledConsumerOrderStatus(order.status)) return false;
  if (visitClosedByPaymentToday(allOrders, nowMs)) return false;
  return isConsumerOrderKstToday(order.created_at, nowMs);
}
