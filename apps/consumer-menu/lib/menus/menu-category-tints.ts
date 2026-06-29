/** 카테고리 인덱스별 색상 팔레트 — 소비자 메뉴판·점주 홈 메뉴 카드 공통 */

type MenuCategoryTint = {
  card: string;
  /** 점주 홈 등 — 카테고리 구간 래퍼 */
  section: string;
  /** 카테고리 제목 뱃지 (홈) */
  header: string;
  /** 점주 메뉴 탭 — 카테고리 블록 (rounded-2xl) */
  block: string;
  /** 점주 메뉴 탭 — 큰 카테고리 제목 */
  title: string;
  /** 점주 메뉴 탭 — 개수 뱃지 */
  count: string;
  /** 점주 메뉴 탭 — 목록 구분선 */
  listDivider: string;
};

const MENU_CATEGORY_TINTS: readonly MenuCategoryTint[] = [
  {
    card: "rounded-xl border border-chaya-border/60 bg-chaya-surface p-2 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900",
    section:
      "overflow-hidden rounded-xl border border-zinc-200/80 border-l-[3px] border-l-zinc-400 bg-zinc-50/70 dark:border-zinc-700 dark:border-l-zinc-500 dark:bg-zinc-800/40",
    header:
      "rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    block:
      "overflow-hidden rounded-2xl border border-zinc-200/80 border-l-[3px] border-l-zinc-400 bg-zinc-50/70 shadow-sm dark:border-zinc-700 dark:border-l-zinc-500 dark:bg-zinc-800/40",
    title: "text-zinc-900 dark:text-zinc-50",
    count:
      "rounded-full bg-zinc-100/90 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300",
    listDivider: "border-zinc-200/70 dark:border-zinc-700/70",
  },
  {
    card: "rounded-xl border border-amber-200/70 bg-amber-50/50 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-amber-900/40 dark:bg-amber-950/25",
    section:
      "overflow-hidden rounded-xl border border-amber-200/70 border-l-[3px] border-l-amber-500 bg-amber-50/55 dark:border-amber-900/45 dark:border-l-amber-400 dark:bg-amber-950/30",
    header:
      "rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
    block:
      "overflow-hidden rounded-2xl border border-amber-200/70 border-l-[3px] border-l-amber-500 bg-amber-50/55 shadow-sm dark:border-amber-900/45 dark:border-l-amber-400 dark:bg-amber-950/30",
    title: "text-amber-950 dark:text-amber-50",
    count:
      "rounded-full bg-amber-100/90 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
    listDivider: "border-amber-200/50 dark:border-amber-900/40",
  },
  {
    card: "rounded-xl border border-sky-200/70 bg-sky-50/45 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-sky-900/40 dark:bg-sky-950/25",
    section:
      "overflow-hidden rounded-xl border border-sky-200/70 border-l-[3px] border-l-sky-500 bg-sky-50/50 dark:border-sky-900/45 dark:border-l-sky-400 dark:bg-sky-950/30",
    header:
      "rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-900 dark:bg-sky-950/50 dark:text-sky-200",
    block:
      "overflow-hidden rounded-2xl border border-sky-200/70 border-l-[3px] border-l-sky-500 bg-sky-50/50 shadow-sm dark:border-sky-900/45 dark:border-l-sky-400 dark:bg-sky-950/30",
    title: "text-sky-950 dark:text-sky-50",
    count:
      "rounded-full bg-sky-100/90 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
    listDivider: "border-sky-200/50 dark:border-sky-900/40",
  },
  {
    card: "rounded-xl border border-violet-200/70 bg-violet-50/40 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-violet-900/40 dark:bg-violet-950/20",
    section:
      "overflow-hidden rounded-xl border border-violet-200/70 border-l-[3px] border-l-violet-500 bg-violet-50/45 dark:border-violet-900/45 dark:border-l-violet-400 dark:bg-violet-950/28",
    header:
      "rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-900 dark:bg-violet-950/50 dark:text-violet-200",
    block:
      "overflow-hidden rounded-2xl border border-violet-200/70 border-l-[3px] border-l-violet-500 bg-violet-50/45 shadow-sm dark:border-violet-900/45 dark:border-l-violet-400 dark:bg-violet-950/28",
    title: "text-violet-950 dark:text-violet-50",
    count:
      "rounded-full bg-violet-100/90 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
    listDivider: "border-violet-200/50 dark:border-violet-900/40",
  },
  {
    card: "rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-emerald-900/40 dark:bg-emerald-950/20",
    section:
      "overflow-hidden rounded-xl border border-emerald-200/70 border-l-[3px] border-l-emerald-500 bg-emerald-50/45 dark:border-emerald-900/45 dark:border-l-emerald-400 dark:bg-emerald-950/28",
    header:
      "rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
    block:
      "overflow-hidden rounded-2xl border border-emerald-200/70 border-l-[3px] border-l-emerald-500 bg-emerald-50/45 shadow-sm dark:border-emerald-900/45 dark:border-l-emerald-400 dark:bg-emerald-950/28",
    title: "text-emerald-950 dark:text-emerald-50",
    count:
      "rounded-full bg-emerald-100/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
    listDivider: "border-emerald-200/50 dark:border-emerald-900/40",
  },
  {
    card: "rounded-xl border border-rose-200/60 bg-rose-50/35 p-2 shadow-sm transition-shadow hover:shadow-md dark:border-rose-900/35 dark:bg-rose-950/20",
    section:
      "overflow-hidden rounded-xl border border-rose-200/65 border-l-[3px] border-l-rose-500 bg-rose-50/40 dark:border-rose-900/40 dark:border-l-rose-400 dark:bg-rose-950/25",
    header:
      "rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-900 dark:bg-rose-950/50 dark:text-rose-200",
    block:
      "overflow-hidden rounded-2xl border border-rose-200/65 border-l-[3px] border-l-rose-500 bg-rose-50/40 shadow-sm dark:border-rose-900/40 dark:border-l-rose-400 dark:bg-rose-950/25",
    title: "text-rose-950 dark:text-rose-50",
    count:
      "rounded-full bg-rose-100/90 px-2 py-0.5 text-[11px] font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
    listDivider: "border-rose-200/45 dark:border-rose-900/35",
  },
] as const;

function normalizeCategoryTintIndex(index: number): number {
  const len = MENU_CATEGORY_TINTS.length;
  return ((index % len) + len) % len;
}

export function menuCardClassForCategoryIndex(index: number): string {
  return MENU_CATEGORY_TINTS[normalizeCategoryTintIndex(index)]!.card;
}

export function menuCategorySectionClassForIndex(index: number): string {
  return MENU_CATEGORY_TINTS[normalizeCategoryTintIndex(index)]!.section;
}

export function menuCategoryHeaderClassForIndex(index: number): string {
  return MENU_CATEGORY_TINTS[normalizeCategoryTintIndex(index)]!.header;
}

export function menuCategoryBlockClassForIndex(index: number): string {
  return MENU_CATEGORY_TINTS[normalizeCategoryTintIndex(index)]!.block;
}

export function menuCategoryTitleClassForIndex(index: number): string {
  return MENU_CATEGORY_TINTS[normalizeCategoryTintIndex(index)]!.title;
}

export function menuCategoryCountBadgeClassForIndex(index: number): string {
  return MENU_CATEGORY_TINTS[normalizeCategoryTintIndex(index)]!.count;
}

export function menuCategoryListDividerClassForIndex(index: number): string {
  return MENU_CATEGORY_TINTS[normalizeCategoryTintIndex(index)]!.listDivider;
}
