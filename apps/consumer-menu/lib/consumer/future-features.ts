/**
 * 소비자 `/t/*` — 결제·직원 호출 등 **향후 기능**용 플래그·주석만 둡니다.
 * 실제 PG·알림 연동 전까지 UI는 비활성 또는 501 응답을 유지합니다.
 */

/** `true`가 되면 결제 단계(서버 라우트/액션)를 연결합니다. 당분간 `false`. */
export const CONSUMER_CHECKOUT_PAYMENT_IMPLEMENTED = false as const;

/** `true`가 되면 직원 호출이 서버로 전송됩니다. 당분간 `false`. */
export const CONSUMER_STAFF_CALL_IMPLEMENTED = false as const;

/** 향후 `POST /t/{tenant}/staff-call` 본문 스키마 예시(미사용). */
export type StaffCallRequestBody = {
  tenant: string;
  table?: string | null;
  message?: string | null;
};
