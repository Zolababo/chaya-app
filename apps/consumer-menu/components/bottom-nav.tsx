"use client";

import { ClipboardList, Menu, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";
import { CHAYA_CART_CHANGED_EVENT, cartTotalQty } from "@/lib/cart/local-cart";
import { chayaAppShellNavInnerClass } from "@/lib/responsive/chaya-app-shell";

type Props = {
  tenant: string;
};

function NavItem({
  href,
  active,
  label,
  ariaLabel,
  icon,
  easyMode,
}: {
  href: string;
  active: boolean;
  label: string;
  ariaLabel: string;
  icon: ReactNode;
  easyMode: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "relative flex flex-1 flex-col items-center gap-0.5 px-4 py-1 font-medium transition-colors",
        easyMode ? "min-h-[44px] text-xs sm:text-sm" : "min-h-[40px] text-[11px]",
        active
          ? "text-chaya-primary"
          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
      aria-label={ariaLabel}
    >
      <span className={active ? "scale-110 transition-transform" : "transition-transform"} aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
      {active ? (
        <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-chaya-primary" aria-hidden />
      ) : null}
    </Link>
  );
}

export function BottomNav({ tenant }: Props) {
  const { m } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();
  const pathname = usePathname();
  const slug = tenant.trim();
  const [cartCount, setCartCount] = useState(0);
  const basePath = `/t/${tenant}`;
  const navHref = useConsumerNavHref(tenant);
  const menuPath = easyMode ? `${basePath}/barrier-free` : basePath;
  const base = navHref(menuPath);
  const cartHref = navHref(`${basePath}/cart`);
  const ordersHref = navHref(`${basePath}/orders`);

  const refreshCartCount = useCallback(() => {
    setCartCount(cartTotalQty(slug));
  }, [slug]);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  useEffect(() => {
    const onCartChanged = (ev: Event) => {
      const detail = (ev as CustomEvent<{ tenant?: string }>).detail;
      if (detail?.tenant === slug) refreshCartCount();
    };
    const onStorage = (ev: StorageEvent) => {
      if (!ev.key) return;
      const cartKey = `chaya_cart_v1:${encodeURIComponent(slug)}`;
      if (ev.key === cartKey) refreshCartCount();
    };
    window.addEventListener(CHAYA_CART_CHANGED_EVENT, onCartChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHAYA_CART_CHANGED_EVENT, onCartChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [slug, refreshCartCount]);

  const onMenu =
    pathname === basePath ||
    pathname === `${basePath}/` ||
    pathname.startsWith(`${basePath}/barrier-free`);
  const onCart = pathname.startsWith(`${basePath}/cart`);
  const onOrders = pathname.startsWith(`${basePath}/orders`);

  const iconSize = "size-[18px]";

  const cartIcon = (
    <span className="relative inline-flex">
      <ShoppingCart className={iconSize} strokeWidth={2} />
      {cartCount > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-chaya-primary text-[10px] font-semibold text-chaya-on-primary">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      ) : null}
    </span>
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-chaya-border/80 bg-chaya-bg/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur supports-[backdrop-filter]:bg-chaya-bg/80 dark:border-zinc-800 dark:bg-zinc-950/95"
      aria-label={m.nav.menu}
    >
      <div className={`${chayaAppShellNavInnerClass} chaya-app-shell--consumer flex items-center justify-around`}>
        <NavItem
          href={base}
          active={onMenu}
          label={m.nav.menu}
          ariaLabel={m.menu.boardTitle}
          easyMode={easyMode}
          icon={<Menu className={iconSize} strokeWidth={2} />}
        />
        <NavItem
          href={cartHref}
          active={onCart}
          label={m.nav.cart}
          ariaLabel={cartCount > 0 ? `${m.nav.cart}, ${cartCount}` : m.nav.cart}
          easyMode={easyMode}
          icon={cartIcon}
        />
        <NavItem
          href={ordersHref}
          active={onOrders}
          label={m.nav.orders}
          ariaLabel={m.nav.orders}
          easyMode={easyMode}
          icon={<ClipboardList className={iconSize} strokeWidth={2} />}
        />
      </div>
    </nav>
  );
}
