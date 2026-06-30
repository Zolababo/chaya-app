"use client";

import Link from "next/link";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";
import { CHAYA_CART_CHANGED_EVENT, cartTotalQty, readCart } from "@/lib/cart/local-cart";
import { chayaAppShellNavInnerClass } from "@/lib/responsive/chaya-app-shell";

type Props = {
  tenant: string;
};

/** 메뉴판 하단: 담긴 품목이 있을 때 장바구니로 가는 고정 바. */
export function MenuCartStickyBar({ tenant }: Props) {
  const { locale, m } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();
  const navHref = useConsumerNavHref(tenant);
  const pathname = usePathname();
  const slug = tenant.trim();
  const [qty, setQty] = useState(0);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(() => {
    const lines = readCart(slug);
    setQty(cartTotalQty(slug));
    setTotal(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onChanged = (ev: Event) => {
      const detail = (ev as CustomEvent<{ tenant?: string }>).detail;
      if (detail?.tenant === slug) refresh();
    };
    window.addEventListener(CHAYA_CART_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(CHAYA_CART_CHANGED_EVENT, onChanged);
  }, [slug, refresh]);

  const onMenuItemDetail = /\/menu\/[^/]+/.test(pathname);
  if (qty <= 0 || pathname.includes("/cart") || pathname.includes("/orders") || onMenuItemDetail) {
    return null;
  }

  const cartHref = navHref(`/t/${slug}/cart`);
  const countLabel =
    locale === "ko" || locale === "ja"
      ? `${qty}개`
      : locale.startsWith("zh")
        ? `${qty}件`
        : `×${qty}`;

  return (
    <div className="fixed inset-x-0 bottom-[var(--chaya-consumer-cart-bar-offset)] z-30">
      <Link
        href={cartHref}
        className={`${chayaAppShellNavInnerClass} chaya-app-shell--consumer flex w-full items-center justify-between gap-2 rounded-xl bg-chaya-primary px-3.5 py-2 text-chaya-on-primary shadow-lg transition hover:bg-chaya-primary-hover active:scale-[0.99] ${easyMode ? "min-h-[52px]" : "min-h-[40px]"}`}
        aria-label={`${m.nav.cart} ${countLabel}, ${formatConsumerMoney(total, locale)}`}
      >
        <span className={`inline-flex items-center gap-2 font-semibold ${easyMode ? "text-base" : "text-sm"}`}>
          <ShoppingCart className={easyMode ? "size-5" : "size-4"} aria-hidden strokeWidth={2.5} />
          {m.nav.cart} {countLabel}
        </span>
        <span className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${easyMode ? "text-lg" : "text-base"}`}>
          {formatConsumerMoney(total, locale)}
          <ChevronRight className="size-4 opacity-90" aria-hidden />
        </span>
      </Link>
    </div>
  );
}
