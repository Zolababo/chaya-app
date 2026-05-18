import type { ChayaMenuRow } from "./types";

const DEFAULT_CATEGORY = "기타";

/** 메인 → 사이드 → 음료 → 디저트 → 기타 (한·영 카테고리명 휴리스틱). */
const CATEGORY_RANK_RULES: { rank: number; patterns: RegExp[] }[] = [
  {
    rank: 0,
    patterns: [
      /^메인$/i,
      /메인/,
      /^main$/i,
      /\bmain\b/,
      /mains/,
      /entree/i,
      /primary/i,
      /식사/,
      /식사류/,
      /한식/,
      /분식/,
      /면류/,
      /밥/,
      /버거/,
      /burger/i,
      /pizza/i,
      /치킨/,
      /chicken/i,
      /set\b/i,
      /combo/i,
    ],
  },
  {
    rank: 1,
    patterns: [
      /^사이드$/i,
      /사이드/,
      /^side$/i,
      /\bside\b/,
      /sides/,
      /반찬/,
      /스낵/,
      /snack/i,
      /appetizer/i,
      /starter/i,
      /토핑/,
      /추가/,
      /extra/i,
    ],
  },
  {
    rank: 2,
    patterns: [
      /^음료$/i,
      /음료/,
      /^drink$/i,
      /\bdrink\b/,
      /drinks/,
      /beverage/i,
      /커피/,
      /coffee/i,
      /tea/i,
      /주스/,
      /juice/i,
      /맥주/,
      /beer/i,
      /주류/,
      /alcohol/i,
      /소다/,
      /soda/i,
    ],
  },
  {
    rank: 3,
    patterns: [/^디저트$/i, /디저트/, /dessert/i, /후식/, /케이크/, /cake/i],
  },
  {
    rank: 90,
    patterns: [/^기타$/, /^other$/i, /\betc\b/i],
  },
];

function normalizeCategoryLabel(raw: string | null | undefined): string {
  const t = raw?.trim();
  return t || DEFAULT_CATEGORY;
}

export function getCategorySortRank(category: string | null | undefined): number {
  const label = normalizeCategoryLabel(category);
  const folded = label.normalize("NFKC").toLowerCase();

  for (const { rank, patterns } of CATEGORY_RANK_RULES) {
    if (patterns.some((re) => re.test(folded) || re.test(label))) return rank;
  }
  return 50;
}

export function compareCategoryNames(a: string, b: string): number {
  const rankDiff = getCategorySortRank(a) - getCategorySortRank(b);
  if (rankDiff !== 0) return rankDiff;
  return a.localeCompare(b, "ko");
}

export function sortCategoryNames(categories: string[]): string[] {
  return [...categories].sort(compareCategoryNames);
}

export function compareMenuRowsForDisplay(a: ChayaMenuRow, b: ChayaMenuRow): number {
  const catCmp = compareCategoryNames(
    normalizeCategoryLabel(a.category),
    normalizeCategoryLabel(b.category),
  );
  if (catCmp !== 0) return catCmp;
  const orderDiff = a.sortOrder - b.sortOrder;
  if (orderDiff !== 0) return orderDiff;
  return a.name.localeCompare(b.name, "ko");
}

export function sortMenuItemsForDisplay(items: ChayaMenuRow[]): ChayaMenuRow[] {
  return [...items].sort(compareMenuRowsForDisplay);
}

export function categoryLabelOf(item: { category?: string | null }): string {
  return normalizeCategoryLabel(item.category);
}

/** 주문 내역 라인 — 메뉴 카탈로그 이름으로 카테고리 순 정렬. */
function menuNameToCategory(menuItems: ChayaMenuRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of menuItems) {
    map.set(item.name, categoryLabelOf(item));
  }
  return map;
}

export function sortLinesByMenuCategory<T extends { name: string }>(
  lines: T[],
  menuItems: ChayaMenuRow[],
): T[] {
  const nameToCategory = menuNameToCategory(menuItems);
  return [...lines].sort((a, b) => {
    const catCmp = compareCategoryNames(
      nameToCategory.get(a.name) ?? DEFAULT_CATEGORY,
      nameToCategory.get(b.name) ?? DEFAULT_CATEGORY,
    );
    if (catCmp !== 0) return catCmp;
    return a.name.localeCompare(b.name, "ko");
  });
}

export type OrderLineGroup<T extends { name: string }> = {
  category: string;
  lines: T[];
};

export function groupOrderLinesByMenuCategory<T extends { name: string }>(
  lines: T[],
  menuItems: ChayaMenuRow[],
): OrderLineGroup<T>[] {
  const nameToCategory = menuNameToCategory(menuItems);
  const sorted = sortLinesByMenuCategory(lines, menuItems);
  const groups: OrderLineGroup<T>[] = [];
  for (const line of sorted) {
    const category = nameToCategory.get(line.name) ?? DEFAULT_CATEGORY;
    const tail = groups[groups.length - 1];
    if (tail?.category === category) tail.lines.push(line);
    else groups.push({ category, lines: [line] });
  }
  return groups;
}
