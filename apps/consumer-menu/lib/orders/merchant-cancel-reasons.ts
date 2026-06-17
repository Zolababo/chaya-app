/** DB `orders.cancel_reason` — 점주가 선택하는 취소 사유 코드. */
export const MERCHANT_CANCEL_REASONS = [
  "guest_change",
  "sold_out",
  "duplicate",
  "staff_error",
  "table_move",
  "app_error",
  "other",
] as const;

export type MerchantCancelReason = (typeof MERCHANT_CANCEL_REASONS)[number];

const LABELS: Record<MerchantCancelReason, string> = {
  guest_change: "손님 변심",
  sold_out: "재료·메뉴 품절",
  duplicate: "중복 주문",
  staff_error: "직원 실수",
  table_move: "테이블 이동",
  app_error: "앱·시스템 오류",
  other: "기타",
};

export function isMerchantCancelReason(v: string): v is MerchantCancelReason {
  return (MERCHANT_CANCEL_REASONS as readonly string[]).includes(v);
}

export function merchantCancelReasonLabel(code: string | null | undefined): string | null {
  const c = code?.trim();
  if (!c || !isMerchantCancelReason(c)) return null;
  return LABELS[c];
}
