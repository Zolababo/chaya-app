"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect } from "react";

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

  // 클라이언트 메뉴판 마운트 전 layout SSR 목록과 중복 노출 방지 (idle 대기 2.5s 동안 겹침)
  useLayoutEffect(() => {
    document.getElementById("menu-board-ssr")?.remove();
  }, []);

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
