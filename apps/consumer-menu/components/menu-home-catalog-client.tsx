"use client";

import dynamic from "next/dynamic";

import { MenuBoardIdleMount } from "@/components/menu-board-idle-mount";
import { fetchMenuPopularityAction } from "@/lib/consumer/menu-popularity-action";
import type { MenuBoardClientRow } from "@/lib/menus/menu-board-client-row";
import { shouldShowRecentPopularSection } from "@/lib/orders/menu-popularity";
import { useEffect, useState } from "react";

const MenuMerchandisingSections = dynamic(
  () =>
    import("@/components/menu-merchandising-sections").then((m) => m.MenuMerchandisingSections),
  { ssr: false },
);

type Props = {
  tenant: string;
  items: MenuBoardClientRow[];
  categories: string[];
  categoryLabels: Record<string, string>;
};

export function MenuHomeCatalogClient({
  tenant,
  items,
  categories,
  categoryLabels,
}: Props) {
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
      <MenuBoardIdleMount
        tenant={tenant}
        items={items}
        categories={categories}
        categoryLabels={categoryLabels}
        popularMenuIds={popularMenuIds}
      />
    </>
  );
}
