"use client";

import { MenuPromoCarousel } from "@/components/menu-promo-carousel";
import { isConsumerMenuUiV2 } from "@/lib/consumer/future-features";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { buildMenuPromoSlides } from "@/lib/menus/build-menu-promo-slides";
import type { MenuBoardClientRow } from "@/lib/menus/menu-board-client-row";

type Props = {
  tenant: string;
  items: MenuBoardClientRow[];
  showRecentPopular: boolean;
  popularMenuIds: string[];
};

export function MenuMerchandisingSections({
  tenant,
  items,
  showRecentPopular,
  popularMenuIds,
}: Props) {
  const { m } = useConsumerLocale();

  if (!isConsumerMenuUiV2()) return null;

  const slides = buildMenuPromoSlides(items, m.menu, {
    showRecentPopular,
    popularMenuIds,
  });

  if (slides.length === 0) return null;

  return (
    <MenuPromoCarousel
      tenant={tenant}
      slides={slides}
      ariaLabel={[m.menu.todaysMenuLabel, m.menu.recentPopularLabel, m.menu.storeRecommendedLabel].join(
        ", ",
      )}
    />
  );
}
