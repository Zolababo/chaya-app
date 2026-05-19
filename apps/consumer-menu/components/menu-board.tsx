"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MenuCategoryChips } from "@/components/menu-category-chips";
import { MenuListRow } from "@/components/menu-list-row";
import { menuAddButtonClass, menuFlatListBleedClass, menuFlatListItemClass } from "@/components/menu-list-styles";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { addLine } from "@/lib/cart/local-cart";
import { formatKrw, sortMenuItemsForDisplay } from "@/lib/menus/queries";
import { resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categories: string[];
};

const ALL_CATEGORY_KEY = "__all__";

export function MenuBoard({ tenant, items, categories }: Props) {
  const { locale, m } = useConsumerLocale();
  const [active, setActive] = useState<string>(ALL_CATEGORY_KEY);
  const [addedToast, setAddedToast] = useState(false);
  const toastHide = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabCategories = useMemo(
    () => [{ key: ALL_CATEGORY_KEY, label: m.menu.categoryAll }, ...categories.map((c) => ({ key: c, label: c }))],
    [categories, m.menu.categoryAll],
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

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 transition-all duration-200 ${
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
        <ul aria-label={m.menu.boardTitle} className={menuFlatListBleedClass}>
          {filtered.map((raw) => {
            const item = resolveMenuRowForLocale(raw, locale);
            const detailHref = withConsumerLang(
              `/t/${tenant}/menu/${encodeURIComponent(item.id)}`,
              locale,
            );
            return (
              <li key={item.id} className={menuFlatListItemClass}>
                <MenuListRow
                  name={item.name}
                  description={item.description}
                  priceLabel={formatKrw(item.price)}
                  imageUrl={item.imageUrl}
                  soldOut={item.isSoldOut}
                  soldOutLabel={m.menu.soldOut}
                  detailHref={detailHref}
                  detailAriaLabel={`${item.name}, ${formatKrw(item.price)}`}
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
                        className={menuAddButtonClass}
                        onClick={() => {
                          addLine(tenant, item, 1, null);
                          flashAdded();
                        }}
                      >
                        {m.menu.addToCart}
                      </button>
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">{m.menu.categoryEmpty}</p>
      )}
    </>
  );
}
