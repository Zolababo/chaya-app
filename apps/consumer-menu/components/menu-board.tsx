"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { MenuCategoryChips } from "@/components/menu-category-chips";
import { MenuItemBadgeStrip } from "@/components/menu-item-badge-strip";
import { MenuScrollPad } from "@/components/menu-scroll-pad";
import { MenuListRow } from "@/components/menu-list-row";
import {
  menuAddIconButtonClass,
  menuCardListClass,
} from "@/components/menu-list-styles";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { addLine } from "@/lib/cart/local-cart";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import {
  groupMenuItemsByCategory,
  sortMenuItemsForDisplay,
} from "@/lib/menus/category-order";
import { menuCardClassForCategoryIndex } from "@/lib/menus/menu-category-tints";
import { menuBoardClientRowAsCartItem } from "@/lib/menus/menu-board-client-row";
import type { MenuBoardClientRow } from "@/lib/menus/menu-board-client-row";
import { resolveMenuItemBadges } from "@/lib/menus/menu-item-badges";
import { menuHasSelectableOptions } from "@/lib/menus/menu-options";
import type { ChayaMenuRow } from "@/lib/menus/types";

const MenuDetailSheet = dynamic(
  () => import("@/components/menu-detail-sheet").then((m) => m.MenuDetailSheet),
  { ssr: false },
);

type Props = {
  tenant: string;
  items: MenuBoardClientRow[];
  categories: string[];
  categoryLabels: Record<string, string>;
  popularMenuIds?: string[];
};

const ALL_CATEGORY_KEY = "__all__";

export function MenuBoard({
  tenant,
  items,
  categories,
  categoryLabels,
  popularMenuIds = [],
}: Props) {
  const { locale, m } = useConsumerLocale();
  const [active, setActive] = useState<string>(ALL_CATEGORY_KEY);
  const [addedToast, setAddedToast] = useState(false);
  const [sheetItem, setSheetItem] = useState<ChayaMenuRow | null>(null);
  const toastHide = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabCategories = useMemo(
    () => [
      { key: ALL_CATEGORY_KEY, label: m.menu.categoryAll },
      ...categories.map((c) => ({ key: c, label: categoryLabels[c] ?? c })),
    ],
    [categories, m.menu.categoryAll, categoryLabels],
  );

  const badgeLabels = useMemo(
    () => ({
      featured: m.menu.badgeFeatured,
      popular: m.menu.badgePopular,
      new: m.menu.badgeNew,
    }),
    [m.menu.badgeFeatured, m.menu.badgePopular, m.menu.badgeNew],
  );

  useEffect(() => {
    return () => {
      if (toastHide.current) clearTimeout(toastHide.current);
    };
  }, []);

  useLayoutEffect(() => {
    document.getElementById("menu-board-ssr")?.remove();
  }, []);

  const flashAdded = () => {
    setAddedToast(true);
    if (toastHide.current) clearTimeout(toastHide.current);
    toastHide.current = setTimeout(() => setAddedToast(false), 2200);
  };

  const sortedItems = useMemo(
    () => sortMenuItemsForDisplay(items as unknown as ChayaMenuRow[]),
    [items],
  );

  const filtered = useMemo(() => {
    if (active === ALL_CATEGORY_KEY || categories.length <= 1) return sortedItems;
    return sortedItems.filter((i) => (i.category?.trim() || "기타") === active);
  }, [sortedItems, active, categories.length]);

  const showCategorySections =
    active === ALL_CATEGORY_KEY && categories.length > 1;

  const categorySections = useMemo(
    () => (showCategorySections ? groupMenuItemsByCategory(filtered, categories) : []),
    [showCategorySections, filtered, categories],
  );

  const openSheet = (raw: MenuBoardClientRow) => {
    setSheetItem(menuBoardClientRowAsCartItem(raw));
  };

  const renderCard = (raw: MenuBoardClientRow, categoryTintIndex = 0, listIndex?: number) => {
    const item = raw;
    const badges = resolveMenuItemBadges(menuBoardClientRowAsCartItem(item), popularMenuIds, badgeLabels);
    const badgeSuffix = badges.length > 0 ? `, ${badges.map((b) => b.label).join(", ")}` : "";
    const hasOptions = menuHasSelectableOptions(menuBoardClientRowAsCartItem(item).optionGroups);

    const rowLarge = false;
    const rowXlarge = false;

    return (
      <li key={item.id} className={`relative ${menuCardClassForCategoryIndex(categoryTintIndex)}`}>
        <MenuItemBadgeStrip badges={badges} />
        <MenuListRow
          large={rowLarge}
          xlarge={rowXlarge}
          imagePriority={listIndex != null && listIndex < 6}
          name={item.name}
          description={item.description}
          priceLabel={formatConsumerMoney(item.price, locale)}
          imageUrl={item.imageUrl}
          soldOut={item.isSoldOut}
          onDetailClick={() => openSheet(raw)}
          detailAriaLabel={`${item.name}, ${formatConsumerMoney(item.price, locale)}${badgeSuffix}`}
          trailing={
            item.isSoldOut ? (
              <span
                className="flex min-h-[40px] items-center px-1.5 text-xs font-semibold text-zinc-400"
                aria-label={`${item.name} ${m.menu.soldOut}`}
              >
                {m.menu.soldOut}
              </span>
            ) : (
              <button
                type="button"
                aria-label={`${item.name} ${m.menu.addToCart}`}
                className={menuAddIconButtonClass}
                onClick={() => {
                  if (hasOptions) {
                    openSheet(raw);
                    return;
                  }
                  addLine(tenant, menuBoardClientRowAsCartItem(item), 1, null);
                  flashAdded();
                }}
              >
                <Plus className="size-5" strokeWidth={2.5} aria-hidden />
              </button>
            )
          }
        />
      </li>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.75rem))] z-40 flex justify-center px-4 transition-all duration-200 ${
          addedToast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="rounded-full border border-chaya-primary/15 bg-chaya-surface/95 px-5 py-2.5 text-sm font-semibold text-chaya-primary shadow-lg backdrop-blur-sm dark:bg-zinc-900/95 dark:text-orange-300">
          {m.menu.addedToast}
        </div>
      </div>

      <MenuCategoryChips
        tabs={tabCategories}
        active={active}
        onSelect={setActive}
        ariaLabel={m.menu.categoryNav}
      />

      {filtered.length > 0 ? (
        showCategorySections ? (
          <div className="space-y-5" aria-label={m.menu.boardTitle}>
            {categorySections.map((section, sectionIndex) => (
              <section key={section.category} aria-labelledby={`menu-cat-${sectionIndex}`}>
                <h2
                  id={`menu-cat-${sectionIndex}`}
                  className="sticky top-0 z-[1] -mx-1 border-b border-chaya-border/50 bg-background/90 px-1 pb-2 pt-1 text-sm font-bold tracking-tight text-zinc-800 backdrop-blur-sm dark:border-zinc-800 dark:text-zinc-100"
                >
                  {categoryLabels[section.category] ?? section.category}
                </h2>
                <ul className={`${menuCardListClass} mt-2`}>
                  {section.items.map((raw, itemIndex) => {
                    const flatIndex = categorySections
                      .slice(0, sectionIndex)
                      .reduce((n, s) => n + s.items.length, 0) + itemIndex;
                    return renderCard(raw, sectionIndex, flatIndex);
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul aria-label={m.menu.boardTitle} className={menuCardListClass}>
            {filtered.map((raw, index) => renderCard(raw, 0, index))}
          </ul>
        )
      ) : (
        <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">{m.menu.categoryEmpty}</p>
      )}
      <MenuScrollPad tenant={tenant} />

      <MenuDetailSheet
        tenant={tenant}
        item={sheetItem}
        open={sheetItem != null}
        onClose={() => setSheetItem(null)}
        onAdded={flashAdded}
      />
    </>
  );
}
