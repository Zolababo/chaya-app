"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { CHAYA_CART_CHANGED_EVENT, addLine, cartTotalQty } from "@/lib/cart/local-cart";
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
  const slug = tenant.trim();
  const [active, setActive] = useState<string>(ALL_CATEGORY_KEY);
  const [cartCount, setCartCount] = useState(0);
  const [lastMessage, setLastMessage] = useState("");

  useEffect(() => {
    setLastMessage(m.barrierFree.ready);
  }, [m.barrierFree.ready]);

  const refreshCartCount = useCallback(() => {
    setCartCount(cartTotalQty(slug));
  }, [slug]);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  useEffect(() => {
    const onChanged = (ev: Event) => {
      const detail = (ev as CustomEvent<{ tenant?: string }>).detail;
      if (detail?.tenant === slug) refreshCartCount();
    };
    const onStorage = (ev: StorageEvent) => {
      if (!ev.key) return;
      const expected = `chaya_cart_v1:${encodeURIComponent(slug)}`;
      if (ev.key === expected) refreshCartCount();
    };
    window.addEventListener(CHAYA_CART_CHANGED_EVENT, onChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHAYA_CART_CHANGED_EVENT, onChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [slug, refreshCartCount]);

  const tabCategories = useMemo(
    () => [{ key: ALL_CATEGORY_KEY, label: m.menu.categoryAll }, ...categories.map((c) => ({ key: c, label: c }))],
    [categories, m.menu.categoryAll],
  );

  const filtered = useMemo(() => {
    if (active === ALL_CATEGORY_KEY) return items;
    return items.filter((item) => (item.category?.trim() || "기타") === active);
  }, [items, active]);

  const basePath = `/t/${encodeURIComponent(slug)}`;

  return (
    <>
      <section
        aria-label={m.barrierFree.categoryNav}
        className="rounded-2xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <div className="flex flex-wrap gap-2">
          {tabCategories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setActive(cat.key);
                setLastMessage(
                  m.barrierFree.categoryChanged.replace("{category}", cat.label),
                );
              }}
              aria-pressed={active === cat.key}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold ${
                active === cat.key
                  ? "border-chaya-primary bg-chaya-primary text-chaya-on-primary"
                  : "border-chaya-border bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <section aria-label={m.barrierFree.menuList} className="space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            {m.barrierFree.categoryEmpty}
          </p>
        ) : (
          filtered.map((item) => {
            const row = resolveMenuRowForLocale(item, locale);
            const name = row.name;
            return (
              <article
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className="text-base font-semibold">{name}</h2>
                  <p className="text-sm font-semibold tabular-nums text-chaya-primary dark:text-orange-400">
                    {formatConsumerMoney(item.price, locale)}
                    {item.isSoldOut ? (
                      <span className="ml-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {m.barrierFree.soldOut}
                      </span>
                    ) : null}
                  </p>
                  {row.description?.trim() ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{row.description}</p>
                  ) : null}
                  <Link
                    href={withConsumerLang(`${basePath}/menu/${encodeURIComponent(item.id)}`, locale)}
                    className="inline-flex min-h-[44px] items-center text-sm font-semibold text-chaya-primary underline-offset-4 hover:underline dark:text-orange-400"
                    aria-label={m.barrierFree.detailAria.replace("{name}", name)}
                  >
                    {name} {m.barrierFree.detailLink}
                  </Link>
                </div>
                {item.isSoldOut ? (
                  <span
                    className="flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 px-4 text-sm font-semibold text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                    aria-label={`${name} ${m.barrierFree.soldOut}`}
                  >
                    {m.barrierFree.soldOut}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      addLine(slug, row, 1, null);
                      setLastMessage(m.barrierFree.addedOne.replace("{name}", name));
                      refreshCartCount();
                    }}
                    aria-label={`${name} 1 ${m.barrierFree.add}`}
                    className="min-h-[44px] shrink-0 rounded-lg bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary hover:bg-chaya-primary-hover"
                  >
                    {m.barrierFree.add}
                  </button>
                )}
              </article>
            );
          })
        )}
      </section>

      <nav
        aria-label={m.barrierFree.navNext}
        className="flex flex-col gap-3 rounded-2xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950 sm:flex-row sm:flex-wrap sm:justify-center"
      >
        <Link
          href={withConsumerLang(basePath, locale)}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-4 py-3 text-center text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
          aria-label={m.barrierFree.toGridAria}
        >
          {m.barrierFree.toGridMenu}
        </Link>
        <Link
          href={withConsumerLang(`${basePath}/cart`, locale)}
          className="flex min-h-[48px] items-center justify-center rounded-xl bg-chaya-primary px-4 py-3 text-center text-sm font-semibold text-chaya-on-primary"
          aria-label={
            cartCount > 0
              ? m.barrierFree.toCartWithCount.replace("{count}", String(cartCount))
              : m.barrierFree.toCartAria
          }
        >
          {cartCount > 0
            ? m.barrierFree.toCartWithCount.replace("{count}", String(cartCount))
            : m.barrierFree.toCart}
        </Link>
        <Link
          href={withConsumerLang(`${basePath}/orders`, locale)}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-4 py-3 text-center text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
          aria-label={m.barrierFree.toOrdersAria}
        >
          {m.barrierFree.toOrders}
        </Link>
      </nav>

      <section
        className="rounded-2xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950"
        aria-label={m.nav.cart}
      >
        <p className="text-sm">{m.barrierFree.cartSummary.replace("{count}", String(cartCount))}</p>
      </section>

      <p
        aria-live="polite"
        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100"
      >
        {m.barrierFree.statusLabel}: {lastMessage}
      </p>
    </>
  );
}
