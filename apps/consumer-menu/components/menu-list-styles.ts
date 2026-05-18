/** 맥도날드·KFC형 플랫 메뉴 리스트 (바깥 카드 없음, 구분선만). */
export const menuFlatListClass =
  "divide-y divide-zinc-200/90 dark:divide-zinc-800";

/** 메인 `px-4` 안에서 구분선을 화면 너비까지 늘릴 때 */
export const menuFlatListBleedClass = "-mx-4 divide-y divide-zinc-200/90 sm:-mx-6 dark:divide-zinc-800";

export const menuFlatListItemClass = "px-4 sm:px-6";

/** 손님 메뉴판 담기 (44px 터치 유지, 시각적 크기는 축소) */
export const menuAddButtonClass =
  "touch-manipulation min-h-[40px] shrink-0 rounded-full bg-chaya-primary px-3.5 py-1.5 text-xs font-semibold text-chaya-on-primary transition hover:bg-chaya-primary-hover active:scale-[0.98]";
