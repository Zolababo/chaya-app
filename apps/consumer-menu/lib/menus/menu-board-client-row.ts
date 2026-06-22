import type { AppLocale } from "@/lib/i18n/locales";
import { buildCategoryDisplayMap, resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";
import type { ChayaMenuRow } from "@/lib/menus/types";

/** 손님 MenuBoard 클라이언트 props — locale resolve 완료, translations 없음 */
export type MenuBoardClientRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  /** canonical category key (필터·그룹) */
  category: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isSoldOut: boolean;
  isTodaysPick: boolean;
  isStoreRecommended: boolean;
  createdAt: string | null;
};

export function toMenuBoardClientRow(row: ChayaMenuRow, locale: AppLocale): MenuBoardClientRow {
  const resolved = resolveMenuRowForLocale(row, locale);
  return {
    id: row.id,
    name: resolved.name,
    description: resolved.description,
    price: row.price,
    category: row.category?.trim() || "기타",
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    isSoldOut: row.isSoldOut,
    isTodaysPick: row.isTodaysPick,
    isStoreRecommended: row.isStoreRecommended,
    createdAt: row.createdAt,
  };
}

export function toMenuBoardClientRows(items: ChayaMenuRow[], locale: AppLocale): MenuBoardClientRow[] {
  return items.map((row) => toMenuBoardClientRow(row, locale));
}

/** 장바구니·상세 시트 호환 (options/translations 없음 — 보드 select와 동일) */
export function menuBoardClientRowAsCartItem(row: MenuBoardClientRow): ChayaMenuRow {
  return {
    ...row,
    optionGroups: [],
    translations: {},
    translationSource: null,
    spiceLevel: null,
  };
}

export function categoryLabelsRecord(
  items: ChayaMenuRow[],
  categories: string[],
  locale: AppLocale,
): Record<string, string> {
  return Object.fromEntries(buildCategoryDisplayMap(items, categories, locale));
}
