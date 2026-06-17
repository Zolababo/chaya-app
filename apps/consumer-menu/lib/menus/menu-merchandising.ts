import type { ChayaMenuRow } from "@/lib/menus/types";

import { sortMenuItemsForDisplay } from "./category-order";

/** 최근 인기 집계 기간(일). */
export const MENU_POPULARITY_LOOKBACK_DAYS = 7;

/** 이 기간 내 주문 건수가 미만이면 「최근 인기」 섹션을 숨깁니다. */
export const MENU_POPULARITY_MIN_ORDERS = 5;

export const MAX_TODAYS_PICK_ITEMS = 3;
export const MAX_STORE_RECOMMENDED_ITEMS = 8;
export const MAX_RECENT_POPULAR_ITEMS = 5;

export function filterTodaysPickMenus(items: ChayaMenuRow[]): ChayaMenuRow[] {
  return sortMenuItemsForDisplay(items.filter((i) => !i.isSoldOut && i.isTodaysPick)).slice(
    0,
    MAX_TODAYS_PICK_ITEMS,
  );
}

export function filterStoreRecommendedMenus(items: ChayaMenuRow[]): ChayaMenuRow[] {
  return sortMenuItemsForDisplay(items.filter((i) => !i.isSoldOut && i.isStoreRecommended)).slice(
    0,
    MAX_STORE_RECOMMENDED_ITEMS,
  );
}

/** 메뉴 리스트 「인기」 스티커 — 1위 1개만 */
export function getTopPopularMenuId(rankedMenuIds: readonly string[]): string | null {
  const id = rankedMenuIds[0]?.trim();
  return id ? id : null;
}

/** 프로모 캐러셀 「요즘 뜨는」— 판매 2위 메뉴 1개 */
export function resolveSecondPopularMenuItem(
  items: ChayaMenuRow[],
  rankedMenuIds: readonly string[],
): ChayaMenuRow | null {
  const id = rankedMenuIds[1]?.trim();
  if (!id) return null;
  const row = items.find((i) => i.id === id);
  if (!row || row.isSoldOut) return null;
  return row;
}

export function resolvePopularMenuItems(
  items: ChayaMenuRow[],
  rankedMenuIds: string[],
  max = MAX_RECENT_POPULAR_ITEMS,
): ChayaMenuRow[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: ChayaMenuRow[] = [];
  for (const id of rankedMenuIds) {
    const row = byId.get(id);
    if (!row || row.isSoldOut) continue;
    out.push(row);
    if (out.length >= max) break;
  }
  return out;
}
