import type { MenuPromoSlide } from "@/components/menu-promo-carousel";
import {
  filterStoreRecommendedMenus,
  filterTodaysPickMenus,
  resolveSecondPopularMenuItem,
} from "@/lib/menus/menu-merchandising";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Labels = {
  todaysMenuLabel: string;
  recentPopularLabel: string;
  storeRecommendedLabel: string;
};

/** 상단 프로모 카드 한 덩어리 — 오늘의 메뉴 → 최근 인기 → 사장님 추천 순, 중복 메뉴는 앞 섹션만 */
export function buildMenuPromoSlides(
  items: ChayaMenuRow[],
  labels: Labels,
  options: { showRecentPopular: boolean; popularMenuIds: string[] },
): MenuPromoSlide[] {
  const seen = new Set<string>();
  const slides: MenuPromoSlide[] = [];

  const push = (list: ChayaMenuRow[], badge: string) => {
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      slides.push({ item, badge });
    }
  };

  push(filterTodaysPickMenus(items), labels.todaysMenuLabel);

  if (options.showRecentPopular) {
    const second = resolveSecondPopularMenuItem(items, options.popularMenuIds);
    if (second) push([second], labels.recentPopularLabel);
  }

  push(filterStoreRecommendedMenus(items), labels.storeRecommendedLabel);

  return slides;
}
