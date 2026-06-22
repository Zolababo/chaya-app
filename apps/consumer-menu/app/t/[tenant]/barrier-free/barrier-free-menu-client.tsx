"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MenuCategoryChips } from "@/components/menu-category-chips";
import { MenuScrollPad } from "@/components/menu-scroll-pad";
import { MenuListRow } from "@/components/menu-list-row";
import {
  menuCardItemClass,
  menuCardListClass,
  srMenuAddButtonClass,
} from "@/components/menu-list-styles";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";
import { addLine } from "@/lib/cart/local-cart";
import { sortMenuItemsForDisplay } from "@/lib/menus/queries";
import { buildCategoryDisplayMap, resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categories: string[];
};

const ALL_CATEGORY_KEY = "__all__";

export function BarrierFreeMenuClient({ tenant, items, categories }: Props) {
  const { locale, m } = useConsumerLocale();
  const navHref = useConsumerNavHref(tenant);
  const slug = tenant.trim();
  const [active, setActive] = useState<string>(ALL_CATEGORY_KEY);
  const [lastMessage, setLastMessage] = useState("");
  const announceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLastMessage(m.barrierFree.ready);
  }, [m.barrierFree.ready]);

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

  const sortedItems = useMemo(() => sortMenuItemsForDisplay(items), [items]);

  const filtered = useMemo(() => {
    if (active === ALL_CATEGORY_KEY || categories.length <= 1) return sortedItems;
    return sortedItems.filter((item) => (item.category?.trim() || "기타") === active);
  }, [sortedItems, active, categories.length]);

  const announce = (msg: string) => {
    setLastMessage(msg);
    const el = announceRef.current;
    if (el) {
      el.textContent = "";
      requestAnimationFrame(() => {
        el.textContent = msg;
      });
    }
  };

  const handleCategorySelect = (key: string) => {
    setActive(key);
    const label = tabCategories.find((c) => c.key === key)?.label ?? key;
    announce(m.barrierFree.categoryChanged.replace("{category}", label));
  };

  const handleAdd = (name: string) => {
    announce(m.barrierFree.addedOne.replace("{name}", name));
  };

  return (
    <>
      <div
        ref={announceRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {lastMessage}
      </div>

      <MenuCategoryChips
        tabs={tabCategories}
        active={active}
        onSelect={handleCategorySelect}
        ariaLabel={m.barrierFree.categoryNav}
        screenReaderMode
      />

      {filtered.length > 0 ? (
        <ul aria-label={m.barrierFree.menuList} className={menuCardListClass}>
          {filtered.map((raw) => {
            const item = resolveMenuRowForLocale(raw, locale);
            const name = item.name;
            const detailHref = navHref(
              `/t/${encodeURIComponent(slug)}/menu/${encodeURIComponent(item.id)}`,
            );
            return (
              <li key={item.id} className={menuCardItemClass}>
                <MenuListRow
                  xlarge
                  name={name}
                  description={item.description}
                  priceLabel={formatConsumerMoney(item.price, locale)}
                  imageUrl={item.imageUrl}
                  soldOut={item.isSoldOut}
                  detailHref={detailHref}
                  detailAriaLabel={m.barrierFree.detailAria.replace("{name}", name)}
                  trailing={
                    item.isSoldOut ? (
                      <span className="flex min-h-[48px] items-center px-2 text-base font-semibold text-zinc-500">
                        {m.barrierFree.soldOut}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={srMenuAddButtonClass}
                        onClick={() => {
                          addLine(slug, item, 1, null);
                          handleAdd(name);
                        }}
                      >
                        {m.barrierFree.add}
                      </button>
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-10 text-center text-base text-zinc-500 dark:text-zinc-400">
          {m.barrierFree.categoryEmpty}
        </p>
      )}
      <MenuScrollPad tenant={slug} />
    </>
  );
}
