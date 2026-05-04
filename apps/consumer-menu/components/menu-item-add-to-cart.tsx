"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { addLine } from "@/lib/cart/local-cart";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  item: ChayaMenuRow;
};

export function MenuItemAddToCart({ tenant, item }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);

  const addAndGo = () => {
    addLine(tenant, item, qty, null);
    router.push(`/t/${tenant}/cart`);
  };

  return (
    <div className="fixed bottom-28 left-0 right-0 z-30 flex flex-col items-center gap-3 px-4">
      <div className="flex w-full max-w-md items-center justify-between rounded-2xl border border-chaya-border bg-chaya-surface px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">수량</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-zinc-200 text-lg font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            aria-label="수량 한 개 줄이기"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="min-w-8 text-center text-lg font-semibold tabular-nums" aria-live="polite" aria-atomic>
            {qty}
          </span>
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-zinc-200 text-lg font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            aria-label="수량 한 개 늘리기"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
          >
            +
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={addAndGo}
        className="min-h-[48px] w-full max-w-md rounded-2xl bg-chaya-primary px-6 py-4 text-lg font-bold text-chaya-on-primary shadow-md"
        aria-label={`${item.name} ${qty}개 장바구니에 담고 주문 확인으로 이동`}
      >
        장바구니에 담기
      </button>
    </div>
  );
}
