"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { MenuCategoryChips } from "@/components/menu-category-chips";
import { MenuScrollPad } from "@/components/menu-scroll-pad";
import { MenuListRow } from "@/components/menu-list-row";
import {
  menuAddIconButtonEasyClass,
  menuCardItemClass,
  menuCardListClass,
} from "@/components/menu-list-styles";
import { useConsumerVoiceAnnounce } from "@/lib/consumer/use-consumer-voice-announce";
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
  const { speak } = useConsumerVoiceAnnounce();
  const slug = tenant.trim();
  const [active, setActive] = useState<string>(ALL_CATEGORY_KEY);
  const [addedToast, setAddedToast] = useState(false);
  const [lastMessage, setLastMessage] = useState("");
  const toastHide = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLastMessage(m.barrierFree.ready);
  }, [m.barrierFree.ready]);

  useEffect(() => {
    return () => {
      if (toastHide.current) clearTimeout(toastHide.current);
    };
  }, []);

  const flashAdded = (name: string) => {
    const msg = m.barrierFree.addedOne.replace("{name}", name);
    setLastMessage(msg);
    speak(msg);
    setAddedToast(true);
    if (toastHide.current) clearTimeout(toastHide.current);
    toastHide.current = setTimeout(() => setAddedToast(false), 2200);
  };

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

  const handleCategorySelect = (key: string) => {
    setActive(key);
    const label = tabCategories.find((c) => c.key === key)?.label ?? key;
    const msg = m.barrierFree.categoryChanged.replace("{category}", label);
    setLastMessage(msg);
    speak(msg);
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
                        className={menuAddIconButtonEasyClass}
                        onClick={() => {
                          addLine(slug, item, 1, null);
                          flashAdded(name);
                        }}
                      >
                        <Plus className="size-6" strokeWidth={2.5} aria-hidden />
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
      <MenuScrollPad tenant={slug} />
    </>
  );
}
