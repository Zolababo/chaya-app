import { getCategorySortRank } from "./category-order";
import { sortMenuItemsForDisplay } from "./queries";
import type { ChayaMenuRow } from "./types";

/** 오늘의 메뉴 배너용 — 메인(음식) 카테고리·이미지 있는 품목 우선. */
export function pickTodaysMenuItems(items: ChayaMenuRow[], max = 3): ChayaMenuRow[] {
  const available = items.filter((i) => !i.isSoldOut);
  const sorted = sortMenuItemsForDisplay(available);
  const withImage = sorted.filter((i) => i.imageUrl?.trim());
  const mains = withImage.filter((i) => getCategorySortRank(i.category) === 0);
  const pool = mains.length > 0 ? mains : withImage.length > 0 ? withImage : sorted;
  return pool.slice(0, Math.max(1, max));
}
