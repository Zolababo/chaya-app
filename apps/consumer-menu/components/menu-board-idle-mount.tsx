"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import type { MenuBoardClientRow } from "@/lib/menus/menu-board-client-row";

const MenuBoard = dynamic(
  () => import("@/components/menu-board").then((m) => m.MenuBoard),
  { ssr: false },
);

const IDLE_TIMEOUT_MS = 2500;

type Props = {
  tenant: string;
  items: MenuBoardClientRow[];
  categories: string[];
  categoryLabels: Record<string, string>;
  popularMenuIds?: string[];
};

export function MenuBoardIdleMount({
  tenant,
  items,
  categories,
  categoryLabels,
  popularMenuIds = [],
}: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => setReady(true), { timeout: IDLE_TIMEOUT_MS });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) return null;

  return (
    <MenuBoard
      tenant={tenant}
      items={items}
      categories={categories}
      categoryLabels={categoryLabels}
      popularMenuIds={popularMenuIds}
    />
  );
}
