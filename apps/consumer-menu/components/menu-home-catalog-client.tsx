"use client";

import { useEffect, useState } from "react";

import { fetchMenuPopularityAction } from "@/lib/consumer/menu-popularity-action";
import { MenuBoard } from "@/components/menu-board";
import { MenuMerchandisingSections } from "@/components/menu-merchandising-sections";
import type { ChayaMenuRow } from "@/lib/menus/types";
import { shouldShowRecentPopularSection } from "@/lib/orders/menu-popularity";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categories: string[];
};

/** 메뉴 목록은 SSR, 인기 집계·뱃지는 마운트 후 비동기 — 첫 paint 가속 */
export function MenuHomeCatalogClient({ tenant, items, categories }: Props) {
  const [popularMenuIds, setPopularMenuIds] = useState<string[]>([]);
  const [showRecentPopular, setShowRecentPopular] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchMenuPopularityAction(tenant).then((popularity) => {
      if (cancelled) return;
      setPopularMenuIds(popularity.rankedMenuIds);
      setShowRecentPopular(shouldShowRecentPopularSection(popularity));
    });
    return () => {
      cancelled = true;
    };
  }, [tenant]);

  return (
    <>
      <MenuMerchandisingSections
        tenant={tenant}
        items={items}
        showRecentPopular={showRecentPopular}
        popularMenuIds={popularMenuIds}
      />
      <MenuBoard
        tenant={tenant}
        items={items}
        categories={categories}
        popularMenuIds={popularMenuIds}
      />
    </>
  );
}
