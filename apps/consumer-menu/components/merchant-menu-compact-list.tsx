"use client";

import { useMemo } from "react";

import { MerchantMenuCompactRow } from "@/components/merchant-menu-compact-row";
import { MerchantLoadingCenter } from "@/components/merchant-loading-center";
import {
  invalidateMerchantCacheForTenant,
  merchantCacheKey,
} from "@/lib/merchant/merchant-client-cache";
import { parseMerchantLiveMenus } from "@/lib/merchant/merchant-live-types";
import type { MerchantMenusTab } from "@/lib/merchant/merchant-menus-href";
import { useMerchantLiveFetch } from "@/lib/merchant/use-merchant-live-fetch";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  selectedMenuId: string | null;
  onSelectMenu: (menuId: string) => void;
  filterTab?: MerchantMenusTab;
  /** 편집 라우트 등 — 선택 시 href 대신 onSelect만 */
  compactOnly?: boolean;
};

function filterItems(items: ChayaMenuRow[], tab: MerchantMenusTab): ChayaMenuRow[] {
  if (tab === "selling") return items.filter((i) => !i.isSoldOut);
  if (tab === "soldout") return items.filter((i) => i.isSoldOut);
  return items;
}

/** 가로 2-pane 왼쪽 — compact 메뉴 목록 */
export function MerchantMenuCompactList({
  tenant,
  selectedMenuId,
  onSelectMenu,
  filterTab = "all",
}: Props) {
  const tEnc = encodeURIComponent(tenant);
  const cacheKey = merchantCacheKey(tenant, "menus");
  const url = `/m/${tEnc}/live/menus`;

  const { data, isRefreshing } = useMerchantLiveFetch({
    tenant,
    cacheKey,
    url,
    invalidateScope: "menus",
    parse: parseMerchantLiveMenus,
  });

  const items = useMemo(() => filterItems(data?.items ?? [], filterTab), [data?.items, filterTab]);

  if (!data && isRefreshing) {
    return <MerchantLoadingCenter context="menus" compact />;
  }

  if (items.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">표시할 메뉴가 없어요</p>
    );
  }

  return (
    <ul className="space-y-2" aria-label="메뉴 목록">
      {items.map((item) => (
        <MerchantMenuCompactRow
          key={item.id}
          item={item}
          selected={selectedMenuId === item.id}
          onSelect={onSelectMenu}
        />
      ))}
    </ul>
  );
}

/** 메뉴 저장 후 compact 목록 캐시 무효화 */
export function invalidateMerchantMenusCompactList(tenant: string) {
  invalidateMerchantCacheForTenant(tenant, "menus");
}
