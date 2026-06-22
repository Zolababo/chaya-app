/** a0 공통 — 카드·버튼·입력 (주문·로그인·점주) */
import { chayaAppShellBleedClass } from "@/lib/responsive/chaya-app-shell";

export const chayaSurfaceCardClass =
  "rounded-2xl border border-chaya-border/60 bg-chaya-surface shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

export const chayaSurfaceCardPaddedClass = `${chayaSurfaceCardClass} p-4`;

export const chayaPrimaryButtonClass =
  "inline-flex min-h-[48px] items-center justify-center rounded-xl bg-chaya-primary px-6 font-semibold text-chaya-on-primary shadow-sm transition hover:bg-chaya-primary-hover active:scale-[0.99]";

export const chayaSecondaryButtonClass =
  "inline-flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border/80 bg-chaya-surface px-6 font-semibold text-chaya-primary shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export const chayaMutedPanelClass =
  "rounded-2xl border border-chaya-border/60 bg-zinc-50/90 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400";

export const chayaStatusBadgeClass =
  "inline-flex rounded-full bg-chaya-primary/10 px-3 py-1 text-xs font-medium text-chaya-primary dark:bg-orange-950/50 dark:text-orange-300";

export const chayaFormCardClass = `${chayaSurfaceCardClass} space-y-4 p-6`;

export const chayaInputClass =
  "mt-1 min-h-[44px] w-full rounded-xl border border-chaya-border/80 bg-white px-3 py-2 shadow-sm outline-none ring-chaya-primary/30 focus-visible:ring-2 dark:border-zinc-700 dark:bg-zinc-900";

/** 손님 하단 탭 + safe-area */
export const consumerBottomNavClearance = "var(--chaya-consumer-nav-clearance)";

/** a0/restaurant-ui — 카드형 메뉴 목록 (손님 메뉴판) */
export const menuCardListClass = "space-y-2";

export const menuCardItemClass =
  "rounded-xl border border-chaya-border/60 bg-chaya-surface p-2 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900";

/** a0 — 장바구니 카드 목록 */
export const cartCardListClass = "space-y-2 px-4 pb-[9.5rem] sm:px-6";

export const orderCardListClass = "space-y-2";

/** a0 cart-sheet 행 */
export const cartCardItemClass =
  "flex gap-2.5 rounded-xl border border-chaya-border/60 bg-chaya-surface p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

export const cartSheetFooterClass =
  "fixed inset-x-0 bottom-[var(--chaya-consumer-cart-bar-offset)] z-30 border-t border-chaya-border/80 bg-chaya-surface/98 px-4 py-3 shadow-[0_-6px_24px_rgba(0,0,0,0.07)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/98";

export const cartSubmitButtonClass =
  "w-full rounded-xl bg-chaya-primary py-3 text-sm font-semibold text-chaya-on-primary shadow-sm transition hover:bg-chaya-primary-hover active:scale-[0.99] disabled:opacity-60";

/** 큰글씨·목록형 — barrier-free 메뉴 카드와 동일 톤 */
export const cartCardListEasyClass = "space-y-3 pb-[10rem] sm:pb-[10.5rem]";

export const cartCardItemEasyClass = `${menuCardItemClass} overflow-hidden`;

export const cartCategoryLabelEasyClass =
  "px-0.5 text-base font-bold tracking-tight text-zinc-700 dark:text-zinc-300";

export const cartSubmitButtonEasyClass =
  "w-full min-h-[52px] rounded-xl bg-chaya-primary py-3.5 text-base font-bold text-chaya-on-primary shadow-sm transition hover:bg-chaya-primary-hover active:scale-[0.99] disabled:opacity-60";

export const cartSheetFooterEasyClass =
  "fixed inset-x-0 bottom-[var(--chaya-consumer-cart-bar-offset)] z-30 border-t border-chaya-border/80 bg-chaya-surface/98 px-4 py-4 shadow-[0_-6px_24px_rgba(0,0,0,0.07)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/98 sm:px-6";

export const cartQtyMinusClass =
  "flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 transition hover:bg-zinc-200 active:scale-95 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700";

export const cartQtyPlusClass =
  "flex size-7 shrink-0 items-center justify-center rounded-full bg-chaya-primary text-chaya-on-primary transition hover:bg-chaya-primary-hover active:scale-95 disabled:opacity-50";

export const cartQtyMinusEasyClass =
  "flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 transition hover:bg-zinc-200 active:scale-95 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700";

export const cartQtyPlusEasyClass =
  "flex size-11 shrink-0 items-center justify-center rounded-full bg-chaya-primary text-chaya-on-primary transition hover:bg-chaya-primary-hover active:scale-95 disabled:opacity-50";

/** 장바구니·점주 미리보기 등 — 기존 플랫 구분선 리스트 */
export const menuFlatListClass = "divide-y divide-zinc-200/90 dark:divide-zinc-800";

export const menuFlatListBleedClass = `${chayaAppShellBleedClass} divide-y divide-zinc-200/90 dark:divide-zinc-800`;

export const menuFlatListItemClass = "";

/** 담기 — 작은 원형 + 아이콘 (a0). 터치 44px */
export const menuAddIconButtonClass =
  "menu-add-target touch-manipulation flex size-10 shrink-0 items-center justify-center rounded-full bg-chaya-primary text-chaya-on-primary shadow-sm transition hover:bg-chaya-primary-hover active:scale-95";

/** 큰글씨·목록 */
export const menuAddIconButtonEasyClass =
  "menu-add-target touch-manipulation flex size-12 shrink-0 items-center justify-center rounded-full bg-chaya-primary text-chaya-on-primary shadow-sm transition hover:bg-chaya-primary-hover active:scale-95";

/** @deprecated 텍스트 담기 — 점주 화면 등 레거시 */
export const menuAddButtonClass =
  "touch-manipulation min-h-[40px] shrink-0 rounded-full bg-chaya-primary px-3.5 py-1.5 text-xs font-semibold text-chaya-on-primary transition hover:bg-chaya-primary-hover active:scale-[0.98]";

export const menuAddButtonEasyClass =
  "touch-manipulation min-h-[44px] shrink-0 rounded-full bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary transition hover:bg-chaya-primary-hover active:scale-[0.98]";

/** TalkBack/VoiceOver 목록 메뉴 — 텍스트 담기 버튼 */
export const srMenuAddButtonClass =
  "touch-manipulation min-h-[48px] min-w-[4.5rem] shrink-0 rounded-xl bg-chaya-primary px-4 text-base font-bold text-chaya-on-primary shadow-sm transition hover:bg-chaya-primary-hover active:scale-[0.98]";
