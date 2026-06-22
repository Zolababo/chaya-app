import type { MenuPromoSlide } from "@/components/menu-promo-carousel";
import {
  filterStoreRecommendedMenus,
  filterTodaysPickMenus,
  resolveSecondPopularMenuItem,
} from "@/lib/menus/menu-merchandising";
import type { MenuBoardClientRow } from "@/lib/menus/menu-board-client-row";

type Labels = {
  todaysMenuLabel: string;
  recentPopularLabel: string;
  storeRecommendedLabel: string;
};

/** 상단 프로모 카드 한 덩어리 — 오늘의 메뉴 → 최근 인기 → 사장님 추천 순, 중복 메뉴는 앞 섹션만 */
export function buildMenuPromoSlides(
  items: MenuBoardClientRow[],
  labels: Labels,
  options: { showRecentPopular: boolean; popularMenuIds: string[] },
): MenuPromoSlide[] {
  const seen = new Set<string>();
  const slides: MenuPromoSlide[] = [];

  const push = (list: MenuBoardClientRow[], badge: string) => {
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      slides.push({ item, badge });
    }
  };

  const rows = items as unknown as import("@/lib/menus/types").ChayaMenuRow[];

  push(filterTodaysPickMenus(rows) as unknown as MenuBoardClientRow[], labels.todaysMenuLabel);

  if (options.showRecentPopular) {
    const second = resolveSecondPopularMenuItem(rows, options.popularMenuIds);
    if (second) push([second as unknown as MenuBoardClientRow], labels.recentPopularLabel);
  }

  push(filterStoreRecommendedMenus(rows) as unknown as MenuBoardClientRow[], labels.storeRecommendedLabel);

  return slides;
}
