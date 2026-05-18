"use client";

import Link from "next/link";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { CHAYA_CART_CHANGED_EVENT, cartTotalQty, readCart } from "@/lib/cart/local-cart";

type Props = {
  tenant: string;
};

/** 메뉴판 하단: 담긴 품목이 있을 때 장바구니로 가는 고정 바. */
export function MenuCartStickyBar({ tenant }: Props) {
  const { locale, m } = useConsumerLocale();
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

  if (qty <= 0) return null;

  const cartHref = withConsumerLang(`/t/${slug}/cart`, locale);
  const countLabel =
    locale === "ko" || locale === "ja"
      ? `${qty}개`
      : locale.startsWith("zh")
        ? `${qty}件`
        : `×${qty}`;

  return (
    <div className="fixed inset-x-0 bottom-[calc(max(5.5rem,env(safe-area-inset-bottom)+4.5rem))] z-30 flex justify-center px-4">
      <Link
        href={cartHref}
        className="flex min-h-[56px] w-full max-w-lg items-center justify-between gap-3 rounded-2xl bg-chaya-primary px-5 py-3.5 text-chaya-on-primary shadow-[0_8px_32px_rgba(164,55,0,0.35)] transition hover:bg-chaya-primary-hover active:scale-[0.99]"
        aria-label={`${m.nav.cart} ${countLabel}, ${formatConsumerMoney(total, locale)}`}
      >
        <span className="inline-flex items-center gap-2.5 text-base font-bold">
          <ShoppingCart className="size-5" aria-hidden strokeWidth={2.5} />
          {m.nav.cart} {countLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-lg font-bold tabular-nums">
          {formatConsumerMoney(total, locale)}
          <ChevronRight className="size-5 opacity-90" aria-hidden />
        </span>
      </Link>
    </div>
  );
}
