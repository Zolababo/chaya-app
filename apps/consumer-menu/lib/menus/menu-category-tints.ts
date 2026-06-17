/** 카테고리 인덱스별 카드 배경·테두리 (미묘한 구분) */
const MENU_CATEGORY_CARD_TINTS = [
  "rounded-xl border border-chaya-border/60 bg-chaya-surface p-2 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900",
  "rounded-xl border border-amber-200/70 bg-amber-50/50 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-amber-900/40 dark:bg-amber-950/25",
  "rounded-xl border border-sky-200/70 bg-sky-50/45 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-sky-900/40 dark:bg-sky-950/25",
  "rounded-xl border border-violet-200/70 bg-violet-50/40 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-violet-900/40 dark:bg-violet-950/20",
  "rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-emerald-900/40 dark:bg-emerald-950/20",
  "rounded-xl border border-rose-200/60 bg-rose-50/35 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-rose-900/35 dark:bg-rose-950/20",
] as const;

export function menuCardClassForCategoryIndex(index: number): string {
  const i = ((index % MENU_CATEGORY_CARD_TINTS.length) + MENU_CATEGORY_CARD_TINTS.length) % MENU_CATEGORY_CARD_TINTS.length;
  return MENU_CATEGORY_CARD_TINTS[i]!;
}
