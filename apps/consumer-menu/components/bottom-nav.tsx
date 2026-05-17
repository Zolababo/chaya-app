"use client";

import { ClipboardList, Menu, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { CHAYA_CART_CHANGED_EVENT, cartTotalQty } from "@/lib/cart/local-cart";

type Props = {
  tenant: string;
};

export function BottomNav({ tenant }: Props) {
  const { locale, m } = useConsumerLocale();
  const pathname = usePathname();
  const slug = tenant.trim();
  const [cartCount, setCartCount] = useState(0);
  const basePath = `/t/${tenant}`;
  const base = withConsumerLang(basePath, locale);
  const cartHref = withConsumerLang(`${basePath}/cart`, locale);
  const ordersHref = withConsumerLang(`${basePath}/orders`, locale);

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

  const onMenu = pathname === basePath || pathname === `${basePath}/`;
  const onCart = pathname.startsWith(`${basePath}/cart`);
  const onOrders = pathname.startsWith(`${basePath}/orders`);

  const itemClass = (active: boolean) =>
    [
      "flex min-h-[56px] min-w-[72px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 text-[11px] font-semibold tracking-tight transition-colors sm:min-w-[80px] sm:text-xs",
      active
        ? "bg-chaya-primary text-chaya-on-primary shadow-sm"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
    ].join(" ");

  const iconClass = (active: boolean) => (active ? "text-chaya-on-primary" : "text-zinc-500 dark:text-zinc-400");

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-chaya-border bg-chaya-surface pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-950"
      aria-label={m.nav.menu}
    >
      <Link
        href={base}
        className={itemClass(onMenu)}
        aria-current={onMenu ? "page" : undefined}
        aria-label={m.menu.boardTitle}
      >
        <Menu className={`size-6 ${iconClass(onMenu)}`} aria-hidden strokeWidth={2} />
        <span>{m.nav.menu}</span>
      </Link>
      <Link
        href={cartHref}
        className={itemClass(onCart)}
        aria-current={onCart ? "page" : undefined}
        aria-label={cartCount > 0 ? `${m.nav.cart}, ${cartCount}` : m.nav.cart}
      >
        <span className="relative inline-flex" aria-hidden>
          <ShoppingCart className={`size-6 ${iconClass(onCart)}`} strokeWidth={2} />
          {cartCount > 0 ? (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          ) : null}
        </span>
        <span>{m.nav.cart}</span>
      </Link>
      <Link
        href={ordersHref}
        className={itemClass(onOrders)}
        aria-current={onOrders ? "page" : undefined}
        aria-label={m.nav.orders}
      >
        <ClipboardList className={`size-6 ${iconClass(onOrders)}`} strokeWidth={2} aria-hidden />
        <span>{m.nav.orders}</span>
      </Link>
    </nav>
  );
}
