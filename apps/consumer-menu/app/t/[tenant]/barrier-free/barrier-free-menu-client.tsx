"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MenuListRow } from "@/components/menu-list-row";
import { menuFlatListBleedClass, menuFlatListItemClass } from "@/components/menu-list-styles";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { CHAYA_CART_CHANGED_EVENT, addLine, cartTotalQty } from "@/lib/cart/local-cart";
import { sortMenuItemsForDisplay } from "@/lib/menus/queries";
import { resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categories: string[];
};

const ALL_CATEGORY_KEY = "__all__";

const panelClass =
  "easy-contrast-panel rounded-2xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950";

export function BarrierFreeMenuClient({ tenant, items, categories }: Props) {
  const { locale, m } = useConsumerLocale();
  const { enterEasyMode, exitEasyMode } = useConsumerEasyMode();
  const slug = tenant.trim();
  const [active, setActive] = useState<string>(ALL_CATEGORY_KEY);
  const [cartCount, setCartCount] = useState(0);
  const [lastMessage, setLastMessage] = useState("");

  useEffect(() => {
    enterEasyMode();
  }, [enterEasyMode]);

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

  const sortedItems = useMemo(() => sortMenuItemsForDisplay(items), [items]);

  const filtered = useMemo(() => {
    if (active === ALL_CATEGORY_KEY) return sortedItems;
    return sortedItems.filter((item) => (item.category?.trim() || "기타") === active);
  }, [sortedItems, active]);

  const basePath = `/t/${encodeURIComponent(slug)}`;

  const categoryBtnClass = (selected: boolean) =>
    [
      "min-h-[52px] rounded-full border px-5 py-2.5 text-base font-bold",
      selected
        ? "border-chaya-primary bg-chaya-primary text-chaya-on-primary"
        : "border-chaya-border bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50",
    ].join(" ");

  const navLinkClass =
    "flex min-h-[52px] items-center justify-center rounded-xl px-5 py-3 text-center text-base font-bold";

  return (
    <>
      <section aria-label={m.barrierFree.categoryNav} className={panelClass}>
        <div className="flex flex-wrap gap-2.5">
          {tabCategories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setActive(cat.key);
                setLastMessage(m.barrierFree.categoryChanged.replace("{category}", cat.label));
              }}
              aria-pressed={active === cat.key}
              className={categoryBtnClass(active === cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <section aria-label={m.barrierFree.menuList}>
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-lg font-medium text-zinc-700 dark:text-zinc-200">
            {m.barrierFree.categoryEmpty}
          </p>
        ) : (
          <ul className={menuFlatListBleedClass}>
            {filtered.map((item) => {
              const row = resolveMenuRowForLocale(item, locale);
              const name = row.name;
              const detailHref = withConsumerLang(`${basePath}/menu/${encodeURIComponent(item.id)}`, locale);
              return (
                <li key={item.id} className={menuFlatListItemClass}>
                  <MenuListRow
                    xlarge
                    name={name}
                    description={row.description}
                    priceLabel={formatConsumerMoney(item.price, locale)}
                    imageUrl={item.imageUrl}
                    soldOut={item.isSoldOut}
                    soldOutLabel={m.barrierFree.soldOut}
                    detailHref={detailHref}
                    detailAriaLabel={m.barrierFree.detailAria.replace("{name}", name)}
                    trailing={
                      item.isSoldOut ? (
                        <span className="px-2 text-lg font-bold text-zinc-500">{m.barrierFree.soldOut}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            addLine(slug, row, 1, null);
                            setLastMessage(m.barrierFree.addedOne.replace("{name}", name));
                            refreshCartCount();
                          }}
                          aria-label={`${name} 1 ${m.barrierFree.add}`}
                          className="min-h-[52px] shrink-0 rounded-full bg-chaya-primary px-5 text-base font-bold text-chaya-on-primary hover:bg-chaya-primary-hover"
                        >
                          {m.barrierFree.add}
                        </button>
                      )
                    }
                  />
                  <p className="-mt-1 pb-4 pl-[calc(7.5rem+1rem)] sm:pl-[calc(8.5rem+1.25rem)]">
                    <Link
                      href={detailHref}
                      className="inline-flex min-h-[48px] items-center text-base font-bold text-chaya-primary underline underline-offset-4 dark:text-orange-400"
                    >
                      {m.barrierFree.detailLink}
                    </Link>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <nav
        aria-label={m.barrierFree.navNext}
        className={`${panelClass} flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center`}
      >
        <Link
          href={withConsumerLang(basePath, locale)}
          className={`${navLinkClass} border-2 border-chaya-border text-zinc-900 dark:border-zinc-600 dark:text-zinc-50`}
          aria-label={m.barrierFree.toGridAria}
          onClick={exitEasyMode}
        >
          {m.barrierFree.toGridMenu}
        </Link>
        <Link
          href={withConsumerLang(`${basePath}/cart`, locale)}
          className={`${navLinkClass} bg-chaya-primary text-chaya-on-primary`}
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
          className={`${navLinkClass} border-2 border-chaya-border text-zinc-900 dark:border-zinc-600 dark:text-zinc-50`}
          aria-label={m.barrierFree.toOrdersAria}
        >
          {m.barrierFree.toOrders}
        </Link>
      </nav>

      <section className={panelClass} aria-label={m.nav.cart}>
        <p className="text-base leading-relaxed">{m.barrierFree.cartSummary.replace("{count}", String(cartCount))}</p>
      </section>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-3.5 text-base font-medium text-blue-950 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-100"
      >
        <span className="sr-only">{m.barrierFree.statusLabel}: </span>
        {lastMessage}
      </p>
    </>
  );
}
