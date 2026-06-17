/** 손님·점주 화면용 주문 번호 — 영업일(KST) 기준 01, 02, 03 … */
export function formatConsumerOrderNo(
  orderNo: number | null | undefined,
  fallbackOrderId?: string,
): string {
  if (typeof orderNo === "number" && Number.isFinite(orderNo) && orderNo > 0) {
    const n = Math.trunc(orderNo);
    return n < 100 ? String(n).padStart(2, "0") : String(n);
  }
  if (fallbackOrderId) return fallbackOrderId.slice(0, 8);
  return "—";
}

export function parseOrderNoField(raw: unknown): number | null {
  if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
    const rec = raw as Record<string, unknown>;
    if ("order_no" in rec) return parseOrderNoField(rec.order_no);
  }
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}
