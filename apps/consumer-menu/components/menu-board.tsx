"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { MenuCategoryChips } from "@/components/menu-category-chips";
import { MenuDetailSheet } from "@/components/menu-detail-sheet";
import { MenuItemBadgeStrip } from "@/components/menu-item-badge-strip";
import { MenuScrollPad } from "@/components/menu-scroll-pad";
import { MenuListRow } from "@/components/menu-list-row";
import {
  menuAddIconButtonClass,
  menuCardListClass,
} from "@/components/menu-list-styles";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { addLine } from "@/lib/cart/local-cart";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerVoiceAnnounce } from "@/lib/consumer/use-consumer-voice-announce";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import {
  groupMenuItemsByCategory,
  sortMenuItemsForDisplay,
} from "@/lib/menus/category-order";
import { menuCardClassForCategoryIndex } from "@/lib/menus/menu-category-tints";
import { resolveMenuItemBadges } from "@/lib/menus/menu-item-badges";
import { menuHasSelectableOptions } from "@/lib/menus/menu-options";
import { resolveMenuRowForLocale, buildCategoryDisplayMap } from "@/lib/menus/resolve-menu-text";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categories: string[];
  popularMenuIds?: string[];
};

const ALL_CATEGORY_KEY = "__all__";

export function MenuBoard({ tenant, items, categories, popularMenuIds = [] }: Props) {
  const { locale, m } = useConsumerLocale();
  const { fontScale } = useConsumerEasyMode();
  const { speak } = useConsumerVoiceAnnounce();
  const [active, setActive] = useState<string>(ALL_CATEGORY_KEY);
  const [addedToast, setAddedToast] = useState(false);
  const [sheetItem, setSheetItem] = useState<ChayaMenuRow | null>(null);
  const toastHide = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryLabels = useMemo(
    () => buildCategoryDisplayMap(items, categories, locale),
    [items, categories, locale],
  );

  const tabCategories = useMemo(
    () => [
      { key: ALL_CATEGORY_KEY, label: m.menu.categoryAll },
      ...categories.map((c) => ({ key: c, label: categoryLabels.get(c) ?? c })),
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

  const flashAdded = () => {
    setAddedToast(true);
    if (toastHide.current) clearTimeout(toastHide.current);
    toastHide.current = setTimeout(() => setAddedToast(false), 2200);
  };

  const sortedItems = useMemo(() => sortMenuItemsForDisplay(items), [items]);

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

  const openSheet = (raw: ChayaMenuRow) => {
    setSheetItem(resolveMenuRowForLocale(raw, locale));
  };

  const renderCard = (raw: ChayaMenuRow, categoryTintIndex = 0) => {
    const item = resolveMenuRowForLocale(raw, locale);
    const badges = resolveMenuItemBadges(item, popularMenuIds, badgeLabels);
    const badgeSuffix = badges.length > 0 ? `, ${badges.map((b) => b.label).join(", ")}` : "";
    const hasOptions = menuHasSelectableOptions(item.optionGroups);

    const rowLarge = fontScale === "large";
    const rowXlarge = fontScale === "xl";

    return (
      <li key={item.id} className={`relative ${menuCardClassForCategoryIndex(categoryTintIndex)}`}>
        <MenuItemBadgeStrip badges={badges} />
        <MenuListRow
          large={rowLarge}
          xlarge={rowXlarge}
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
                  addLine(tenant, item, 1, null);
                  speak(m.barrierFree.addedOne.replace("{name}", item.name));
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
        easyMode={fontScale !== "normal"}
      />

      {filtered.length > 0 ? (
        showCategorySections ? (
          <div className="space-y-5" aria-label={m.menu.boardTitle}>
            {categorySections.map((section, sectionIndex) => (
              <section key={section.category} aria-labelledby={`menu-cat-${sectionIndex}`}>
                <h2
                  id={`menu-cat-${sectionIndex}`}
                  className={`sticky top-0 z-[1] -mx-1 border-b border-chaya-border/50 bg-background/90 px-1 pb-2 pt-1 font-bold tracking-tight text-zinc-800 backdrop-blur-sm dark:border-zinc-800 dark:text-zinc-100 ${
                    fontScale === "xl" ? "text-lg" : fontScale === "large" ? "text-base" : "text-sm"
                  }`}
                >
                  {categoryLabels.get(section.category) ?? section.category}
                </h2>
                <ul className={`${menuCardListClass} mt-2`}>
                  {section.items.map((raw) => renderCard(raw, sectionIndex))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul aria-label={m.menu.boardTitle} className={menuCardListClass}>
            {filtered.map((raw) => renderCard(raw, 0))}
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
