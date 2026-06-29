/** 테이블 세션 결제 대상 주문 — 포장(테이블 없음)·레거시는 개별 결제 유지. */
export function orderUsesTableSessionPay(
  tableSessionId: string | null | undefined,
  tableNo: string | null | undefined,
): boolean {
  return Boolean(tableSessionId?.trim() && tableNo?.trim());
}
