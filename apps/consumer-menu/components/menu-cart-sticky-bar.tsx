"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CHAYA_CART_CHANGED_EVENT, cartTotalQty, readCart } from "@/lib/cart/local-cart";

type Props = {
  tenant: string;
};

/** 메뉴판 하단: 담긴 품목이 있을 때 장바구니로 가는 고정 바(스티치 StickyCartBar 대응). */
export function MenuCartStickyBar({ tenant }: Props) {
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

  return (
    <div className="fixed inset-x-0 bottom-[calc(max(5.5rem,env(safe-area-inset-bottom)+4.5rem))] z-30 flex justify-center px-4">
      <Link
        href={`/t/${slug}/cart`}
        className="flex min-h-[52px] w-full max-w-lg items-center justify-between gap-3 rounded-2xl bg-chaya-primary px-5 py-3 text-chaya-on-primary shadow-lg transition hover:opacity-95"
        aria-label={`장바구니 ${qty}개, 합계 ${total.toLocaleString("ko-KR")}원, 주문 확인으로 이동`}
      >
        <span className="inline-flex items-center gap-2 font-semibold">
          <ShoppingCart className="size-5" aria-hidden strokeWidth={2} />
          장바구니 {qty}개
        </span>
        <span className="text-lg font-bold tabular-nums">{total.toLocaleString("ko-KR")}원</span>
      </Link>
    </div>
  );
}
