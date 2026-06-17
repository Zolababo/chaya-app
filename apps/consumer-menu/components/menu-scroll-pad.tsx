"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CHAYA_CART_CHANGED_EVENT, cartTotalQty } from "@/lib/cart/local-cart";

type Props = {
  tenant: string;
};

/** 메뉴판 하단 고정 장바구니 바가 있을 때 마지막 메뉴가 가리지 않도록 스크롤 여백 */
export function MenuScrollPad({ tenant }: Props) {
  const pathname = usePathname();
  const slug = tenant.trim();
  const [qty, setQty] = useState(0);

  const refresh = useCallback(() => {
    setQty(cartTotalQty(slug));
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

  const base = `/t/${slug}`;
  const onMenuHome =
    pathname === base ||
    pathname === `${base}/` ||
    pathname.startsWith(`${base}/barrier-free`);
  const hidePad = pathname.includes("/cart") || pathname.includes("/orders") || /\/menu\/[^/]+/.test(pathname);

  if (!onMenuHome || hidePad || qty <= 0) return null;

  return <div className="h-14 shrink-0" aria-hidden />;
}
