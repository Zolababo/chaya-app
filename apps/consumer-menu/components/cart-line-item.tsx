"use client";

import { Minus, Plus, X } from "lucide-react";

import { MenuListThumb } from "@/components/menu-list-thumb";
import {
  cartCardItemClass,
  cartCardItemEasyClass,
  cartQtyMinusClass,
  cartQtyMinusEasyClass,
  cartQtyPlusClass,
  cartQtyPlusEasyClass,
} from "@/components/menu-list-styles";
import type { CartLine } from "@/lib/cart/local-cart";
import { formatSelectedOptionsForNotes } from "@/lib/menus/menu-options";
import type { consumerMessages } from "@/lib/i18n/consumer-messages";

type CartLineMessages = ReturnType<typeof consumerMessages>;
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import type { AppLocale } from "@/lib/i18n/locales";

type Props = {
  line: CartLine;
  lineKey: string;
  locale: AppLocale;
  m: CartLineMessages;
  easyMode: boolean;
  onChangeQty: (key: string, delta: number) => void;
  onRemove: (key: string) => void;
};

export function CartLineItem({
  line,
  lineKey,
  locale,
  m,
  easyMode,
  onChangeQty,
  onRemove,
}: Props) {
  const optNote = formatSelectedOptionsForNotes(line.selectedOptions);
  const lineTotal = line.unitPrice * line.quantity;
  const qtyMinusClass = easyMode ? cartQtyMinusEasyClass : cartQtyMinusClass;
  const qtyPlusClass = easyMode ? cartQtyPlusEasyClass : cartQtyPlusClass;
  const iconSize = easyMode ? "size-5" : "size-3.5";

  if (easyMode) {
    return (
      <li className={cartCardItemEasyClass}>
        <div className="flex flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <MenuListThumb imageUrl={line.imageUrl} xlarge />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xl font-bold leading-snug text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                {line.name}
              </p>
              {optNote ? (
                <p className="mt-1 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">{optNote}</p>
              ) : null}
              <p className="mt-2 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatConsumerMoney(lineTotal, locale)}
              </p>
              {line.quantity >= 2 ? (
                <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
                  {m.cart.unitEach.replace("{price}", formatConsumerMoney(line.unitPrice, locale))}
                </p>
              ) : null}
            </div>
          </div>
          <div
            className="flex items-center justify-between gap-3 border-t border-zinc-200/90 pt-3 dark:border-zinc-700"
            role="group"
            aria-label={`${line.name} ${m.cart.qtySr}`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={qtyMinusClass}
                aria-label={line.quantity <= 1 ? `${line.name} ${m.cart.removeAria}` : m.menu.decreaseQty}
                onClick={() => onChangeQty(lineKey, -1)}
              >
                <Minus className={iconSize} aria-hidden />
              </button>
              <span className="min-w-[2rem] text-center text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {line.quantity}
              </span>
              <button
                type="button"
                className={qtyPlusClass}
                aria-label={m.menu.increaseQty}
                disabled={line.quantity >= 99}
                onClick={() => onChangeQty(lineKey, 1)}
              >
                <Plus className={iconSize} aria-hidden />
              </button>
            </div>
            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
              aria-label={`${line.name} ${m.cart.removeAria}`}
              onClick={() => onRemove(lineKey)}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className={cartCardItemClass}>
      <MenuListThumb imageUrl={line.imageUrl} />
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight text-zinc-900 dark:text-zinc-50">{line.name}</p>
          {optNote ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{optNote}</p>
          ) : null}
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatConsumerMoney(lineTotal, locale)}
          </p>
          {line.quantity >= 2 ? (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {m.cart.unitEach.replace("{price}", formatConsumerMoney(line.unitPrice, locale))}
            </p>
          ) : null}
        </div>
        <div
          className="flex shrink-0 items-center gap-1"
          role="group"
          aria-label={`${line.name} ${m.cart.qtySr}`}
        >
          <button
            type="button"
            className={qtyMinusClass}
            aria-label={line.quantity <= 1 ? `${line.name} ${m.cart.removeAria}` : m.menu.decreaseQty}
            onClick={() => onChangeQty(lineKey, -1)}
          >
            <Minus className={iconSize} aria-hidden />
          </button>
          <span className="w-5 text-center text-sm font-medium tabular-nums">{line.quantity}</span>
          <button
            type="button"
            className={qtyPlusClass}
            aria-label={m.menu.increaseQty}
            disabled={line.quantity >= 99}
            onClick={() => onChangeQty(lineKey, 1)}
          >
            <Plus className={iconSize} aria-hidden />
          </button>
          <button
            type="button"
            className="flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
            aria-label={`${line.name} ${m.cart.removeAria}`}
            onClick={() => onRemove(lineKey)}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
