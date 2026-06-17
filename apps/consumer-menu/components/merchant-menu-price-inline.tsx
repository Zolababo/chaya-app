"use client";

import { useState } from "react";

import { MerchantFormSubmit } from "@/components/merchant-form-submit";

type Props = {
  menuId: string;
  menuName: string;
  initialPrice: number;
};

/** 목록 카드 — 가격 한 줄, 변경 시에만 저장. */
export function MerchantMenuPriceInline({ menuId, menuName, initialPrice }: Props) {
  const [price, setPrice] = useState(String(initialPrice));
  const normalized = price.trim().replace(/,/g, "");
  const dirty = normalized !== String(initialPrice);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`price-${menuId}`}>
        {menuName} 가격
      </label>
      <input
        id={`price-${menuId}`}
        name="price"
        type="text"
        inputMode="numeric"
        required
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="h-9 w-[5.5rem] rounded-lg border border-chaya-border bg-white px-2 text-sm font-bold tabular-nums text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
      />
      <span className="text-xs text-zinc-500">원</span>
      {dirty ? (
        <MerchantFormSubmit
          label="저장"
          pendingLabel="…"
          className="h-9 shrink-0 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900"
        />
      ) : null}
    </div>
  );
}
