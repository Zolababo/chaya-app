/** 테이블 세션·개별 주문 — 결제(방문) 이벤트 건수 (주문 건수 ≠ 결제 건수). */

export function paymentEventKeyFromOrderRow(row: {
  id?: unknown;
  table_session_id?: unknown;
}): string | null {
  const sessionId =
    typeof row.table_session_id === "string" ? row.table_session_id.trim() : "";
  if (sessionId) return `ts:${sessionId}`;
  const orderId = typeof row.id === "string" ? row.id.trim() : "";
  return orderId ? `o:${orderId}` : null;
}

export function paymentEventKeyFromStoreVisitRow(row: {
  order_id?: unknown;
  table_session_id?: unknown;
}): string | null {
  const sessionId =
    typeof row.table_session_id === "string" ? row.table_session_id.trim() : "";
  if (sessionId) return `ts:${sessionId}`;
  const orderId = typeof row.order_id === "string" ? row.order_id.trim() : "";
  return orderId ? `o:${orderId}` : null;
}

/** completed 주문 행 → 결제 이벤트 수 (세션당 1 + 비세션 주문 각 1). */
export function countPaymentEventsFromOrderRows(
  rows: { id?: unknown; table_session_id?: unknown }[],
): number {
  const keys = new Set<string>();
  for (const row of rows) {
    const key = paymentEventKeyFromOrderRow(row);
    if (key) keys.add(key);
  }
  return keys.size;
}

/** store_visits 행 → 결제 이벤트 수 (레거시 per-order + 세션 방문 중복 제거). */
export function countPaymentEventsFromStoreVisitRows(
  rows: { order_id?: unknown; table_session_id?: unknown }[],
): number {
  const keys = new Set<string>();
  for (const row of rows) {
    const key = paymentEventKeyFromStoreVisitRow(row);
    if (key) keys.add(key);
  }
  return keys.size;
}
