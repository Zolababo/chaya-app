"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { MenuListThumb } from "@/components/menu-list-thumb";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
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
        <div className="rounded-2xl border border-chaya-border bg-chaya-surface px-5 py-3 text-sm font-semibold text-zinc-800 shadow-lg dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100">
          {m.menu.addedToast}
        </div>
      </div>

      {tabCategories.length > 1 ? (
        <nav
          className="flex gap-1.5 overflow-x-auto pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    ? "min-h-[44px] shrink-0 rounded-full bg-chaya-primary px-4 py-2 text-xs font-semibold text-chaya-on-primary shadow-sm sm:px-5 sm:text-sm"
                    : "min-h-[44px] shrink-0 rounded-full border border-chaya-border bg-chaya-surface px-4 py-2 text-xs font-semibold text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 sm:px-5 sm:text-sm"
                }
              >
                {cat.label}
              </button>
            );
          })}
        </nav>
      ) : null}

      {filtered.length > 0 ? (
        <ul
          aria-label={m.menu.boardTitle}
          className="divide-y divide-chaya-border overflow-hidden rounded-xl border border-chaya-border bg-chaya-surface dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-950"
        >
          {filtered.map((raw) => {
            const item = resolveMenuRowForLocale(raw, locale);
            return (
              <li key={item.id} className="flex items-stretch gap-2 px-2 py-1.5 sm:gap-3 sm:px-3">
                <Link
                  href={`/t/${tenant}/menu/${encodeURIComponent(item.id)}`}
                  className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 pr-1 outline-none ring-chaya-primary ring-offset-2 ring-offset-background focus-visible:ring-2 sm:gap-3 dark:ring-offset-zinc-950"
                  aria-label={`${item.name}, ${formatKrw(item.price)}`}
                >
                  <MenuListThumb imageUrl={item.imageUrl} />
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="truncate text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </h3>
                    {(item.description ?? "").trim() ? (
                      <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-chaya-muted dark:text-zinc-400">
                        {item.description}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm font-semibold tabular-nums text-chaya-primary dark:text-orange-400">
                      {formatKrw(item.price)}
                      {item.isSoldOut ? (
                        <span className="ml-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          {m.menu.soldOut}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </Link>
                {item.isSoldOut ? (
                  <span
                    className="touch-manipulation flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center self-center rounded-xl border border-zinc-200 bg-zinc-100 px-2 text-center text-xs font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                    aria-label={`${item.name} ${m.menu.soldOut}`}
                  >
                    {m.menu.soldOut}
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={`${item.name} ${m.menu.addToCart}`}
                    className="touch-manipulation min-h-[44px] min-w-[44px] self-center rounded-xl border border-chaya-border bg-chaya-surface px-3 py-2 text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    onClick={() => {
                      addLine(tenant, item, 1, null);
                      flashAdded();
                    }}
                  >
                    {m.menu.addToCart}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-6 text-center text-sm text-chaya-muted dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          {m.menu.categoryEmpty}
        </p>
      )}
    </>
  );
}
