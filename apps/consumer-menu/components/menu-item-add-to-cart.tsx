"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { MenuItemOptionGroups } from "@/components/menu-item-option-groups";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { addLine } from "@/lib/cart/local-cart";
import {
  formatSelectedOptionsForNotes,
  menuHasSelectableOptions,
  validateSelectedOptions,
  type SelectedMenuOption,
} from "@/lib/menus/menu-options";
import type { ChayaMenuRow } from "@/lib/menus/types";

const NOTE_MAX = 200;

type Props = {
  tenant: string;
  item: ChayaMenuRow;
};

export function MenuItemAddToCart({ tenant, item }: Props) {
  const { locale, m } = useConsumerLocale();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<SelectedMenuOption[]>([]);
  const [optError, setOptError] = useState<string | null>(null);
  const noteId = useId();
  const hasOptions = menuHasSelectableOptions(item.optionGroups);

  const unitPrice = useMemo(() => {
    const delta = selected.reduce((s, o) => s + o.priceDelta, 0);
    return item.price + delta;
  }, [item.price, selected]);

  const addAndGo = () => {
    if (item.isSoldOut) return;
    if (hasOptions) {
      const check = validateSelectedOptions(item.optionGroups, selected);
      if (!check.ok) {
        setOptError(check.message);
        return;
      }
    }
    setOptError(null);
    const optNote = formatSelectedOptionsForNotes(selected);
    const trimmed = notes.trim().slice(0, NOTE_MAX);
    const combined =
      [optNote, trimmed].filter(Boolean).join(" · ") || null;
    addLine(tenant, item, qty, combined, selected);
    router.push(`/t/${tenant}/cart`);
  };

  if (item.isSoldOut) {
    return (
      <div className="fixed bottom-28 left-0 right-0 z-30 flex flex-col items-center gap-3 px-4">
        <p
          role="status"
          className="w-full max-w-md rounded-2xl border border-zinc-300 bg-zinc-100 px-4 py-4 text-center text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {m.menu.soldOutCart}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-28 left-0 right-0 z-30 flex flex-col items-center gap-3 px-4 pb-2">
      <div className="w-full max-w-md space-y-3 rounded-2xl border border-chaya-border bg-chaya-surface px-4 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
        {hasOptions ? (
          <MenuItemOptionGroups groups={item.optionGroups} selected={selected} onChange={setSelected} />
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{m.menu.quantity}</span>
          <div className="flex items-center gap-4" role="group" aria-label={`${item.name} ${m.menu.quantity}`}>
            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-zinc-200 text-lg font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
              aria-label={m.menu.decreaseQty}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="min-w-8 text-center text-lg font-semibold tabular-nums" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-zinc-200 text-lg font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
              aria-label={m.menu.increaseQty}
              onClick={() => setQty((q) => Math.min(99, q + 1))}
            >
              +
            </button>
          </div>
        </div>
        <p className="text-right text-lg font-bold tabular-nums text-chaya-primary dark:text-orange-400">
          {formatConsumerMoney(unitPrice * qty, locale)}
        </p>
        <div>
          <label htmlFor={noteId} className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {m.menu.guestNote}
          </label>
          <textarea
            id={noteId}
            rows={2}
            maxLength={NOTE_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="예: 덜 맵게"
            className="mt-1 w-full resize-y rounded-lg border border-chaya-border bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
        {optError ? (
          <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
            {optError}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={addAndGo}
        className="min-h-[52px] w-full max-w-md rounded-2xl bg-chaya-primary px-6 py-4 text-lg font-bold text-chaya-on-primary shadow-[0_8px_24px_rgba(164,55,0,0.28)] transition hover:bg-chaya-primary-hover active:scale-[0.99]"
      >
        {m.menu.addToCartBar}
      </button>
    </div>
  );
}
