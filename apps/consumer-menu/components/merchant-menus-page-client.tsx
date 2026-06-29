"use client";

import Link from "next/link";
import { ExternalLink, Plus, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MerchantCalloutLink } from "@/components/merchant-callout-link";
import { MerchantEmptyState } from "@/components/merchant-empty-state";
import { MerchantLoadingCenter } from "@/components/merchant-loading-center";
import { MerchantMenuCategoryBlock } from "@/components/merchant-menu-category-block";
import { MerchantMenuCompactList } from "@/components/merchant-menu-compact-list";
import { MerchantMenuDetailPanel } from "@/components/merchant-menu-detail-panel";
import { MerchantActionToast } from "@/components/merchant-action-toast";
import { MerchantMenuTranslationNotice } from "@/components/merchant-menu-translation-notice";
import { chayaPrimaryButtonClass } from "@/components/menu-list-styles";
import {
  merchantMenusActionErrorMessage,
  merchantMenusActionSuccessMessage,
  merchantOwnerLoadErrorMessage,
} from "@/lib/merchant/merchant-owner-copy";
import {
  type MerchantMenusTab,
  merchantMenusHref,
} from "@/lib/merchant/merchant-menus-href";
import {
  invalidateMerchantCacheForTenant,
  merchantCacheKey,
} from "@/lib/merchant/merchant-client-cache";
import { parseMerchantLiveMenus } from "@/lib/merchant/merchant-live-types";
import {
  merchantStickyShellClass,
  merchantTabCountBadgeClass,
  merchantTabLinkClass,
  merchantTabRowClass,
} from "@/lib/merchant/merchant-tab-chrome";
import { useMerchantLiveFetch } from "@/lib/merchant/use-merchant-live-fetch";
import { useMerchantWideLandscape } from "@/lib/responsive/use-merchant-wide-landscape";
import { menuTranslationNotice } from "@/lib/merchant/merchant-menu-translation-source";
import { groupMenuItemsByCategory, sortCategoryNames } from "@/lib/menus/category-order";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  activeTab: MerchantMenusTab;
  errCode?: string;
  okCode?: string;
  warnCode?: string;
  hintCode?: string;
};

function groupByCategory(items: ChayaMenuRow[]): { category: string; items: ChayaMenuRow[] }[] {
  const categories = sortCategoryNames([
    ...new Set(items.map((item) => item.category?.trim() || "기타")),
  ]);
  return groupMenuItemsByCategory(items, categories);
}

export function MerchantMenusPageClient({
  tenant,
  activeTab,
  errCode,
  okCode,
  warnCode,
  hintCode,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wideLandscape = useMerchantWideLandscape();
  const selectedMenuId = searchParams.get("menu")?.trim() || null;

  const tEnc = encodeURIComponent(tenant);
  const cacheKey = merchantCacheKey(tenant, "menus");
  const url = `/m/${tEnc}/live/menus`;

  const { data, error, isRefreshing } = useMerchantLiveFetch({
    tenant,
    cacheKey,
    url,
    invalidateScope: "menus",
    parse: parseMerchantLiveMenus,
  });

  useEffect(() => {
    if (okCode || errCode) {
      invalidateMerchantCacheForTenant(tenant, "menus");
    }
  }, [okCode, errCode, tenant]);

  const errMsg = merchantMenusActionErrorMessage(errCode, hintCode);
  const okMsg = merchantMenusActionSuccessMessage(okCode, warnCode);
  const translationNotice =
    okCode === "saved_hansik" || okCode === "saved_translated"
      ? menuTranslationNotice("hansik")
      : okCode === "saved_ai_new" || okCode === "saved_ai_translated"
        ? menuTranslationNotice("gemini_new")
        : okCode === "saved_ai_cache"
          ? menuTranslationNotice("gemini_cache")
          : null;

  const allItems = useMemo(() => data?.items ?? [], [data?.items]);
  const sellingCount = allItems.filter((i) => !i.isSoldOut).length;
  const soldOutCount = allItems.filter((i) => i.isSoldOut).length;

  const filteredItems = useMemo(() => {
    if (activeTab === "selling") return allItems.filter((i) => !i.isSoldOut);
    if (activeTab === "soldout") return allItems.filter((i) => i.isSoldOut);
    return allItems;
  }, [activeTab, allItems]);

  const grouped = useMemo(() => groupByCategory(filteredItems), [filteredItems]);

  const selectedItem = useMemo(
    () => filteredItems.find((i) => i.id === selectedMenuId) ?? null,
    [filteredItems, selectedMenuId],
  );

  const selectMenu = useCallback(
    (menuId: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("menu", menuId);
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!wideLandscape || filteredItems.length === 0) return;
    if (selectedMenuId && filteredItems.some((i) => i.id === selectedMenuId)) return;
    selectMenu(filteredItems[0]!.id);
  }, [wideLandscape, filteredItems, selectedMenuId, selectMenu]);

  const TABS: { id: MerchantMenusTab; label: string; count: number }[] = [
    { id: "all", label: "전체", count: allItems.length },
    { id: "selling", label: "판매중", count: sellingCount },
    { id: "soldout", label: "품절", count: soldOutCount },
  ];

  const loadError = error ?? (data == null && !isRefreshing ? "메뉴를 불러오지 못했습니다." : null);

  const emptyTitle =
    activeTab === "soldout"
      ? "품절 메뉴가 없어요"
      : activeTab === "selling"
        ? "판매중인 메뉴가 없어요"
        : "아직 등록된 메뉴가 없어요";

  return (
    <>
      <div className={merchantStickyShellClass}>
        <nav className={merchantTabRowClass} aria-label="메뉴 필터">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isSoldoutTab = tab.id === "soldout";
            return (
              <Link
                key={tab.id}
                href={merchantMenusHref(tenant, { tab: tab.id })}
                aria-current={isActive ? "page" : undefined}
                className={merchantTabLinkClass(isActive)}
              >
                {tab.label}
                <span
                  className={merchantTabCountBadgeClass({
                    isActive,
                    alert: isSoldoutTab && tab.count > 0,
                    alertPulse: isSoldoutTab && tab.count > 0 && !isActive,
                  })}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800/80">
          <Link href={`/m/${tEnc}/menus/new`} className={`${chayaPrimaryButtonClass} w-full gap-2`}>
            <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            메뉴 추가
          </Link>
        </div>
      </div>

      <div className="space-y-3 pb-4 pt-2">
        <div className="flex justify-end">
          <Link
            href={`/t/${tEnc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-zinc-600 underline-offset-2 hover:text-chaya-primary hover:underline dark:text-zinc-400 dark:hover:text-orange-400"
          >
            메뉴판 보기
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          </Link>
        </div>

        {okMsg ? <MerchantActionToast message={okMsg} kind="ok" /> : null}
        {errMsg ? <MerchantActionToast message={errMsg} kind="error" /> : null}
        {translationNotice ? (
          <MerchantMenuTranslationNotice notice={translationNotice} prominent />
        ) : null}

        {!data && isRefreshing ? <MerchantLoadingCenter context="menus" /> : null}

        {data && soldOutCount > 0 && activeTab !== "soldout" ? (
          <MerchantCalloutLink
            href={merchantMenusHref(tenant, { tab: "soldout" })}
            title={`품절 메뉴 ${soldOutCount}개`}
            description="손님 메뉴판에 품절로 표시돼요. 재입고하면 판매 재개해 주세요."
            actionLabel="품절 탭"
          />
        ) : null}

        {loadError ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            {merchantOwnerLoadErrorMessage("menus", loadError)}
          </p>
        ) : data && filteredItems.length === 0 ? (
          <MerchantEmptyState
            icon={UtensilsCrossed}
            title={emptyTitle}
            description={
              activeTab === "all"
                ? "위 「메뉴 추가」로 첫 메뉴를 등록한 뒤, 메뉴판 보기로 손님 화면을 확인할 수 있어요."
                : undefined
            }
          />
        ) : data ? (
          wideLandscape && filteredItems.length > 0 ? (
            <div className="merchant-menus-two-pane">
              <div className="merchant-menus-list-pane">
                <MerchantMenuCompactList
                  tenant={tenant}
                  selectedMenuId={selectedMenuId}
                  onSelectMenu={selectMenu}
                  filterTab={activeTab}
                />
              </div>
              <aside className="merchant-menus-detail-pane" aria-label="메뉴 미리보기">
                {selectedItem ? (
                  <MerchantMenuDetailPanel tenant={tenant} item={selectedItem} />
                ) : null}
              </aside>
            </div>
          ) : (
            grouped.map((group, categoryIndex) => (
              <MerchantMenuCategoryBlock
                key={group.category}
                tenant={tenant}
                category={group.category}
                categoryIndex={categoryIndex}
                items={group.items}
                defaultOpen
              />
            ))
          )
        ) : null}
      </div>
    </>
  );
}
