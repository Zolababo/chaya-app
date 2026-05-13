/**
 * 소비자 `/t/*` — 결제·직원 호출은 **당분간 구현 대상이 아님**.
 * 이 파일과 대응 Route Handler만 “언제든 붙일 수 있는” **플래그·타입**을 제공합니다.
 * 고정 스텁 URL: `POST /t/{tenant}/checkout/payment`, `POST /t/{tenant}/staff-call`.
 * PG·알림 키는 **서버 전용**; 클라이언트에는 PG 비밀을 `NEXT_PUBLIC_*` 로 두지 않습니다.
 */

/** `true`가 되면 `POST /t/{tenant}/checkout/payment` 안에서 PG 의도 생성 등을 구현합니다. */
export const CONSUMER_CHECKOUT_PAYMENT_IMPLEMENTED = false as const;

/** `true`가 되면 `POST /t/{tenant}/staff-call` 에서 알림/내부 큐 등으로 전달합니다. */
export const CONSUMER_STAFF_CALL_IMPLEMENTED = false as const;

/** 향후 `POST /t/{tenant}/checkout/payment` 본문 스키마 예시(미사용). */
export type CheckoutPaymentRequestBody = {
  tenant: string;
  /** 예: 주문 id 또는 결제 세션 id — 실제 스키마는 PG 선택 후 확정 */
  orderId?: string | null;
};

/** 향후 `POST /t/{tenant}/staff-call` 본문 스키마 예시(미사용). */
export type StaffCallRequestBody = {
  tenant: string;
  table?: string | null;
  message?: string | null;
};
