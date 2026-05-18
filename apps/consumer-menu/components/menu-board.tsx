"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MenuListRow } from "@/components/menu-list-row";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { addLine } from "@/lib/cart/local-cart";
import { formatKrw } from "@/lib/menus/queries";
import { resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categories: string[];
};

const ALL_CATEGORY_KEY = "__all__";

const listCardClass =
  "divide-y divide-chaya-border overflow-hidden rounded-2xl border border-chaya-border bg-chaya-surface shadow-sm dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-950";

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

  const filtered = useMemo(() => {
    if (active === ALL_CATEGORY_KEY || categories.length <= 1) return items;
    return items.filter((i) => (i.category?.trim() || "기타") === active);
  }, [items, active, categories.length]);

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 transition-all duration-200 ${
          addedToast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="rounded-2xl border border-chaya-primary/20 bg-chaya-surface px-5 py-3 text-sm font-semibold text-chaya-primary shadow-lg dark:border-orange-800/50 dark:bg-zinc-900 dark:text-orange-300">
          {m.menu.addedToast}
        </div>
      </div>

      {tabCategories.length > 1 ? (
        <div className="relative">
          <nav
            className="flex gap-2 overflow-x-auto pb-2 pr-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label={m.menu.categoryNav}
          >
            {tabCategories.map((cat) => {
              const selected = active === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActive(cat.key)}
                  aria-pressed={selected}
                  className={
                    selected
                      ? "min-h-[44px] shrink-0 rounded-full bg-chaya-primary px-5 py-2.5 text-sm font-bold text-chaya-on-primary shadow-md"
                      : "min-h-[44px] shrink-0 rounded-full border border-chaya-border bg-white px-5 py-2.5 text-sm font-semibold text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                  }
                >
                  {cat.label}
                </button>
              );
            })}
          </nav>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"
            aria-hidden
          />
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <ul aria-label={m.menu.boardTitle} className={listCardClass}>
          {filtered.map((raw) => {
            const item = resolveMenuRowForLocale(raw, locale);
            const detailHref = withConsumerLang(
              `/t/${tenant}/menu/${encodeURIComponent(item.id)}`,
              locale,
            );
            return (
              <li key={item.id} className="px-2 py-2 sm:px-3">
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
                        className="flex min-h-[44px] min-w-[52px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 px-2 text-center text-xs font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                        aria-label={`${item.name} ${m.menu.soldOut}`}
                      >
                        {m.menu.soldOut}
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={`${item.name} ${m.menu.addToCart}`}
                        className="touch-manipulation min-h-[44px] min-w-[56px] rounded-xl bg-chaya-primary px-4 py-2.5 text-sm font-bold text-chaya-on-primary shadow-md transition active:scale-[0.97] hover:bg-chaya-primary-hover"
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
        <p className="rounded-2xl border border-chaya-border bg-chaya-surface px-4 py-8 text-center text-sm text-chaya-muted shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          {m.menu.categoryEmpty}
        </p>
      )}
    </>
  );
}