"use client";

import { ClipboardList, Menu, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CHAYA_CART_CHANGED_EVENT, cartTotalQty } from "@/lib/cart/local-cart";

type Props = {
  tenant: string;
};

export function BottomNav({ tenant }: Props) {
  const pathname = usePathname();
  const slug = tenant.trim();
  const [cartCount, setCartCount] = useState(0);
  const base = `/t/${tenant}`;

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

  const onMenu = pathname === base || pathname === `${base}/`;
  const onCart = pathname.startsWith(`${base}/cart`);
  const onOrders = pathname.startsWith(`${base}/orders`);

  const itemClass = (active: boolean) =>
    [
      "flex min-h-[56px] min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-colors",
      active
        ? "bg-chaya-primary text-chaya-on-primary shadow-sm"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
    ].join(" ");

  const iconClass = (active: boolean) => (active ? "text-chaya-on-primary" : "text-zinc-500 dark:text-zinc-400");

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-chaya-border bg-chaya-surface pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="주요 메뉴"
    >
      <Link
        href={base}
        className={itemClass(onMenu)}
        aria-current={onMenu ? "page" : undefined}
        aria-label="메뉴판"
      >
        <Menu className={`size-6 ${iconClass(onMenu)}`} aria-hidden strokeWidth={2} />
        <span aria-hidden>Menu</span>
      </Link>
      <Link
        href={`${base}/cart`}
        className={itemClass(onCart)}
        aria-current={onCart ? "page" : undefined}
        aria-label={cartCount > 0 ? `장바구니, 품목 ${cartCount}개` : "장바구니"}
      >
        <span className="relative inline-flex" aria-hidden>
          <ShoppingCart className={`size-6 ${iconClass(onCart)}`} aria-hidden strokeWidth={2} />
          {cartCount > 0 ? (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          ) : null}
        </span>
        <span aria-hidden>Cart</span>
      </Link>
      <Link
        href={`${base}/orders`}
        className={itemClass(onOrders)}
        aria-current={onOrders ? "page" : undefined}
        aria-label="주문 현황"
      >
        <ClipboardList className={`size-6 ${iconClass(onOrders)}`} aria-hidden strokeWidth={2} />
        <span aria-hidden>Orders</span>
      </Link>
    </nav>
  );
}
