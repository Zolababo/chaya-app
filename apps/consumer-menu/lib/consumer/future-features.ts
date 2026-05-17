/**
 * 소비자 `/t/*` — 기능 플래그·타입.
 *
 * **결제(제품 정책):** 당분간 앱 내 온라인 결제 없음. 손님은 주문 내역·합계만 확인하고
 * **매장 카운터에서 오프라인 결제**. `POST /t/{tenant}/checkout/payment`·PG 연동은
 * 사용량이 커질 때 붙일 **구조만** 유지(`CONSUMER_CHECKOUT_PAYMENT_*` 플래그).
 * PG·알림 키는 서버 전용; 클라이언트에 `NEXT_PUBLIC_*` 비밀 금지.
 *
 * **직원 호출:** `POST /t/{tenant}/staff-call` 스텁(501) — 후순위.
 */

/** `false`이면 메뉴 상단 셀프바 안내를 아예 렌더하지 않는다. */
export const CONSUMER_SELF_BAR_HINT_ENABLED = false as const;

/** `true`일 때만 손님 화면에 카드·간편결제 등 결제 UI를 노출한다. */
export const CONSUMER_CHECKOUT_PAYMENT_UI_VISIBLE = false as const;

/** `true`일 때 `POST /t/{tenant}/checkout/payment` 에서 PG 의도 생성 등을 구현한다. */
export const CONSUMER_CHECKOUT_PAYMENT_IMPLEMENTED = false as const;

/** `true`일 때만 헤더 등에 직원 호출 버튼을 노출한다. */
export const CONSUMER_STAFF_CALL_UI_VISIBLE = false as const;

/** `true`일 때 `POST /t/{tenant}/staff-call` 에서 알림/내부 큐 등으로 전달한다. */
export const CONSUMER_STAFF_CALL_IMPLEMENTED = false as const;

/** `true`일 때 장바구니에 더치페이(1인 참고 금액) 패널을 노출한다. */
export const CONSUMER_SPLIT_BILL_UI_VISIBLE = true as const;

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
