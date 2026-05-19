"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { MenuItemOptionGroups } from "@/components/menu-item-option-groups";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { addLine } from "@/lib/cart/local-cart";
import {
  formatSelectedOptionsForNotes,
  menuHasSelectableOptions,
  validateSelectedOptions,
  type SelectedMenuOption,
} from "@/lib/menus/menu-options";
import type { ChayaMenuRow } from "@/lib/menus/types";

const DOCK_BOTTOM =
  "fixed inset-x-0 bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3.75rem))] z-30 border-t border-zinc-200/90 bg-chaya-surface/98 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/98";

type Props = {
  tenant: string;
  item: ChayaMenuRow;
};

export function MenuItemAddToCart({ tenant, item }: Props) {
  const { locale, m } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();
  const router = useRouter();
  const qtyBtnClass = easyMode
    ? "flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border-2 border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
    : "flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900";
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<SelectedMenuOption[]>([]);
  const [optError, setOptError] = useState<string | null>(null);
  const hasOptions = menuHasSelectableOptions(item.optionGroups);

  const unitPrice = useMemo(() => {
    const delta = selected.reduce((s, o) => s + o.priceDelta, 0);
    return item.price + delta;
  }, [item.price, selected]);

  const lineTotal = unitPrice * qty;

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
    const combined = formatSelectedOptionsForNotes(selected) || null;
    addLine(tenant, item, qty, combined, selected);
    router.push(withConsumerLang(`/t/${tenant}/cart`, locale));
  };

  if (item.isSoldOut) {
    return (
      <div className={`${DOCK_BOTTOM} px-4 py-3`}>
        <p
          role="status"
          className="rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-center text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {m.menu.soldOutCart}
        </p>
      </div>
    );
  }

  return (
    <div className={`${DOCK_BOTTOM} px-4 py-2.5`}>
      {hasOptions ? (
        <div className="mb-2 max-h-[min(28vh,12rem)] overflow-y-auto rounded-lg border border-zinc-200/90 bg-white/80 p-2 dark:border-zinc-700 dark:bg-zinc-900/80">
          <MenuItemOptionGroups groups={item.optionGroups} selected={selected} onChange={setSelected} />
        </div>
      ) : null}

      {optError ? (
        <p role="alert" className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
          {optError}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5" role="group" aria-label={`${item.name} ${m.menu.quantity}`}>
          <button
            type="button"
            className={qtyBtnClass}
            aria-label={m.menu.decreaseQty}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className={`min-w-8 text-center font-bold tabular-nums ${easyMode ? "text-lg" : "text-sm"}`}>
            {qty}
          </span>
          <button
            type="button"
            className={qtyBtnClass}
            aria-label={m.menu.increaseQty}
            onClick={() => setQty((q) => Math.min(99, q + 1))}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        <p
          className={`min-w-0 flex-1 text-right font-bold tabular-nums text-chaya-primary dark:text-orange-400 ${easyMode ? "text-xl" : "text-base"}`}
        >
          {formatConsumerMoney(lineTotal, locale)}
        </p>
        <button
          type="button"
          onClick={addAndGo}
          className={`shrink-0 rounded-xl bg-chaya-primary px-5 font-bold text-chaya-on-primary shadow-md active:scale-[0.99] ${easyMode ? "min-h-[52px] text-base" : "min-h-[44px] text-sm"}`}
        >
          {m.menu.addToCart}
        </button>
      </div>
    </div>
  );
}
