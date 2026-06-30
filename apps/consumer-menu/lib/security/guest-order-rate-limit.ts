/** 손님 주문 submit rate limit (인스턴스별 메모리 — C6 1차). */

export const GUEST_ORDER_RATE_IP_MAX = 8;
export const GUEST_ORDER_RATE_IP_WINDOW_MS = 15 * 60 * 1000;
export const GUEST_ORDER_RATE_SESSION_MAX = 12;
