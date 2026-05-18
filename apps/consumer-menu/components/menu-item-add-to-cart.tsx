"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { MenuItemOptionGroups } from "@/components/menu-item-option-groups";
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

const NOTE_MAX = 200;

const DOCK_BOTTOM =
  "fixed inset-x-0 bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3.75rem))] z-30 border-t border-zinc-200/90 bg-chaya-surface/98 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/98";

type Props = {
  tenant: string;
  item: ChayaMenuRow;
};

export function MenuItemAddToCart({ tenant, item }: Props) {
  const { locale, m } = useConsumerLocale();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedMenuOption[]>([]);
  const [optError, setOptError] = useState<string | null>(null);
  const noteId = useId();
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
    const optNote = formatSelectedOptionsForNotes(selected);
    const trimmed = notes.trim().slice(0, NOTE_MAX);
    const combined = [optNote, trimmed].filter(Boolean).join(" · ") || null;
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

      {noteOpen ? (
        <div className="mb-2">
          <label htmlFor={noteId} className="sr-only">
            {m.menu.guestNote}
          </label>
          <input
            id={noteId}
            type="text"
            maxLength={NOTE_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={m.menu.guestNotePlaceholder}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
          <button
            type="button"
            className="mt-1 text-xs font-medium text-zinc-500 underline-offset-2 hover:underline"
            onClick={() => setNoteOpen(false)}
          >
            {m.menu.guestNoteHide}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="mb-2 text-xs font-semibold text-chaya-primary underline-offset-2 hover:underline dark:text-orange-400"
          onClick={() => setNoteOpen(true)}
        >
          {m.menu.guestNoteToggle}
        </button>
      )}

      {optError ? (
        <p role="alert" className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
          {optError}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5" role="group" aria-label={`${item.name} ${m.menu.quantity}`}>
          <button
            type="button"
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            aria-label={m.menu.decreaseQty}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="min-w-7 text-center text-sm font-bold tabular-nums">{qty}</span>
          <button
            type="button"
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            aria-label={m.menu.increaseQty}
            onClick={() => setQty((q) => Math.min(99, q + 1))}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        <p className="min-w-0 flex-1 text-right text-base font-bold tabular-nums text-chaya-primary dark:text-orange-400">
          {formatConsumerMoney(lineTotal, locale)}
        </p>
        <button
          type="button"
          onClick={addAndGo}
          className="min-h-[44px] shrink-0 rounded-xl bg-chaya-primary px-5 text-sm font-bold text-chaya-on-primary shadow-md active:scale-[0.99]"
        >
          {m.menu.addToCart}
        </button>
      </div>
    </div>
  );
}
