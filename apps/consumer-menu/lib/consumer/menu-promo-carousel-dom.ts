/** 프로모 카드 DOM·스와이프 임계값 */
export const MENU_PROMO_CAROUSEL_SELECTOR = "[data-menu-promo-carousel]";

/** 프로모 카드 — 짧은 가로 스와이프 */
export const PROMO_SWIPE_MIN_PX = 48;

export function isPromoHorizontalSwipe(dx: number, dy: number): boolean {
  return Math.abs(dx) >= PROMO_SWIPE_MIN_PX && Math.abs(dx) >= Math.abs(dy) * 1.2;
}
