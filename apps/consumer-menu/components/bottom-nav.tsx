"use client";

import { ClipboardList, Menu, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { CHAYA_CART_CHANGED_EVENT, cartTotalQty } from "@/lib/cart/local-cart";

type Props = {
  tenant: string;
};

export function BottomNav({ tenant }: Props) {
  const { locale, m } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();
  const pathname = usePathname();
  const slug = tenant.trim();
  const [cartCount, setCartCount] = useState(0);
  const basePath = `/t/${tenant}`;
  const menuPath = easyMode ? `${basePath}/barrier-free` : basePath;
  const base = withConsumerLang(menuPath, locale);
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

  const onMenu =
    pathname === basePath ||
    pathname === `${basePath}/` ||
    pathname.startsWith(`${basePath}/barrier-free`);
  const onCart = pathname.startsWith(`${basePath}/cart`);
  const onOrders = pathname.startsWith(`${basePath}/orders`);

  const itemClass = (active: boolean) =>
    [
      "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 font-bold leading-none tracking-tight transition-colors",
      easyMode
        ? "min-h-[52px] min-w-[4.75rem] max-w-[6rem] text-xs sm:min-w-[5rem] sm:text-sm"
        : "min-h-[44px] min-w-[4.25rem] max-w-[5.5rem] gap-0.5 py-1 text-[10px] font-semibold sm:min-w-[4.5rem] sm:text-[11px]",
      active
        ? "bg-chaya-primary text-chaya-on-primary"
        : "text-zinc-600 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:bg-zinc-800/60",
    ].join(" ");

  const iconClass = (active: boolean) => (active ? "text-chaya-on-primary" : "text-zinc-500 dark:text-zinc-400");

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-zinc-200/90 bg-chaya-surface px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-2px_12px_rgba(0,0,0,0.05)] dark:border-zinc-800 dark:bg-zinc-950"
      aria-label={m.nav.menu}
    >
      <Link
        href={base}
        className={itemClass(onMenu)}
        aria-current={onMenu ? "page" : undefined}
        aria-label={m.menu.boardTitle}
      >
        <Menu className={`${easyMode ? "size-5" : "size-[1.125rem]"} ${iconClass(onMenu)}`} aria-hidden strokeWidth={2} />
        <span>{m.nav.menu}</span>
      </Link>
      <Link
        href={cartHref}
        className={itemClass(onCart)}
        aria-current={onCart ? "page" : undefined}
        aria-label={cartCount > 0 ? `${m.nav.cart}, ${cartCount}` : m.nav.cart}
      >
        <span className="relative inline-flex" aria-hidden>
          <ShoppingCart className={`${easyMode ? "size-5" : "size-[1.125rem]"} ${iconClass(onCart)}`} strokeWidth={2} />
          {cartCount > 0 ? (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border border-chaya-surface bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white dark:border-zinc-950">
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
        <ClipboardList className={`${easyMode ? "size-5" : "size-[1.125rem]"} ${iconClass(onOrders)}`} strokeWidth={2} aria-hidden />
        <span>{m.nav.orders}</span>
      </Link>
    </nav>
  );
}
