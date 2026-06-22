"use client";

import dynamic from "next/dynamic";

import type { MenuBoardClientRow } from "@/lib/menus/menu-board-client-row";

const ExperienceTrackQrScan = dynamic(
  () =>
    import("@/components/experience-track-qr-scan").then((m) => m.ExperienceTrackQrScan),
  { ssr: false },
);

const MenuHomeCatalogClient = dynamic(
  () =>
    import("@/components/menu-home-catalog-client").then((m) => m.MenuHomeCatalogClient),
  { ssr: false },
);

type Props = {
  tenant: string;
  items: MenuBoardClientRow[];
  categories: string[];
  categoryLabels: Record<string, string>;
};

/** QR·인터랙티브 메뉴 — slim props (translations 없음) */
export function MenuHomeDeferredClient({ tenant, items, categories, categoryLabels }: Props) {
  return (
    <>
      <ExperienceTrackQrScan tenant={tenant} />
      <MenuHomeCatalogClient
        tenant={tenant}
        items={items}
        categories={categories}
        categoryLabels={categoryLabels}
      />
    </>
  );
}
