"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MenuCategoryChips } from "@/components/menu-category-chips";
import { MenuListRow } from "@/components/menu-list-row";
import {
  menuAddButtonEasyClass,
  menuFlatListBleedClass,
  menuFlatListItemClass,
} from "@/components/menu-list-styles";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { addLine } from "@/lib/cart/local-cart";
import { sortMenuItemsForDisplay } from "@/lib/menus/queries";
import { resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categories: string[];
};

const ALL_CATEGORY_KEY = "__all__";

export function BarrierFreeMenuClient({ tenant, items, categories }: Props) {
  const { locale, m } = useConsumerLocale();
  const { enterEasyMode } = useConsumerEasyMode();
  const slug = tenant.trim();
  const [active, setActive] = useState<string>(ALL_CATEGORY_KEY);
  const [addedToast, setAddedToast] = useState(false);
  const [lastMessage, setLastMessage] = useState("");
  const toastHide = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    enterEasyMode();
  }, [enterEasyMode]);

  useEffect(() => {
    setLastMessage(m.barrierFree.ready);
  }, [m.barrierFree.ready]);

  useEffect(() => {
    return () => {
      if (toastHide.current) clearTimeout(toastHide.current);
    };
  }, []);

  const flashAdded = (name: string) => {
    setLastMessage(m.barrierFree.addedOne.replace("{name}", name));
    setAddedToast(true);
    if (toastHide.current) clearTimeout(toastHide.current);
    toastHide.current = setTimeout(() => setAddedToast(false), 2200);
  };

  const tabCategories = useMemo(
    () => [{ key: ALL_CATEGORY_KEY, label: m.menu.categoryAll }, ...categories.map((c) => ({ key: c, label: c }))],
    [categories, m.menu.categoryAll],
  );

  const sortedItems = useMemo(() => sortMenuItemsForDisplay(items), [items]);

  const filtered = useMemo(() => {
    if (active === ALL_CATEGORY_KEY || categories.length <= 1) return sortedItems;
    return sortedItems.filter((item) => (item.category?.trim() || "기타") === active);
  }, [sortedItems, active, categories.length]);

  const handleCategorySelect = (key: string) => {
    setActive(key);
    const label = tabCategories.find((c) => c.key === key)?.label ?? key;
    setLastMessage(m.barrierFree.categoryChanged.replace("{category}", label));
  };

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 transition-all duration-200 ${
          addedToast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="rounded-full border border-chaya-primary/15 bg-chaya-surface/95 px-5 py-2.5 text-base font-semibold text-chaya-primary shadow-lg backdrop-blur-sm dark:bg-zinc-900/95 dark:text-orange-300">
          {m.menu.addedToast}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {lastMessage}
      </p>

      <MenuCategoryChips
        tabs={tabCategories}
        active={active}
        onSelect={handleCategorySelect}
        ariaLabel={m.barrierFree.categoryNav}
        easyMode
      />

      {filtered.length > 0 ? (
        <ul aria-label={m.barrierFree.menuList} className={menuFlatListBleedClass}>
          {filtered.map((raw) => {
            const item = resolveMenuRowForLocale(raw, locale);
            const name = item.name;
            const detailHref = withConsumerLang(
              `/t/${encodeURIComponent(slug)}/menu/${encodeURIComponent(item.id)}`,
              locale,
            );
            return (
              <li key={item.id} className={menuFlatListItemClass}>
                <MenuListRow
                  xlarge
                  name={name}
                  description={item.description}
                  priceLabel={formatConsumerMoney(item.price, locale)}
                  imageUrl={item.imageUrl}
                  soldOut={item.isSoldOut}
                  soldOutLabel={m.barrierFree.soldOut}
                  detailHref={detailHref}
                  detailAriaLabel={m.barrierFree.detailAria.replace("{name}", name)}
                  trailing={
                    item.isSoldOut ? (
                      <span
                        className="flex min-h-[44px] items-center px-1.5 text-sm font-semibold text-zinc-400"
                        aria-label={`${name} ${m.barrierFree.soldOut}`}
                      >
                        {m.barrierFree.soldOut}
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={`${name} ${m.menu.addToCart}`}
                        className={menuAddButtonEasyClass}
                        onClick={() => {
                          addLine(slug, item, 1, null);
                          flashAdded(name);
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
        <p className="py-10 text-center text-base text-zinc-500 dark:text-zinc-400">{m.barrierFree.categoryEmpty}</p>
      )}
    </>
  );
}
