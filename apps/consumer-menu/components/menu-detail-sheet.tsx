"use client";

import { Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { MenuItemSpiceLine } from "@/components/menu-item-spice-line";
import { MenuItemOptionGroups } from "@/components/menu-item-option-groups";
import { cartQtyMinusClass, cartQtyPlusClass } from "@/components/menu-list-styles";
import { addLine } from "@/lib/cart/local-cart";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerVoiceAnnounce } from "@/lib/consumer/use-consumer-voice-announce";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import {
  formatSelectedOptionsForNotes,
  menuHasSelectableOptions,
  validateSelectedOptions,
  type SelectedMenuOption,
} from "@/lib/menus/menu-options";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  item: ChayaMenuRow | null;
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
};

export function MenuDetailSheet({ tenant, item, open, onClose, onAdded }: Props) {
  const { locale, m } = useConsumerLocale();
  const { fontScale } = useConsumerEasyMode();
  const { speak } = useConsumerVoiceAnnounce();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<SelectedMenuOption[]>([]);
  const [optError, setOptError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const DISMISS_DRAG_PX = 72;

  function isSheetDragBlocked(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return true;
    return !!target.closest(
      "button, a, input, select, textarea, label, [role='radio'], [role='checkbox'], [data-sheet-no-drag]",
    );
  }

  const hasOptions = item ? menuHasSelectableOptions(item.optionGroups) : false;

  useEffect(() => {
    if (!open || !item) return;
    setQty(1);
    setSelected([]);
    setOptError(null);
    const desc = item.description?.trim();
    const price = formatConsumerMoney(item.price, locale);
    speak(`${item.name}, ${price}${desc ? `. ${desc}` : ""}`);
  }, [open, item?.id, item?.name, item?.description, item?.price, locale, speak]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  /** 시트 — 그립·이미지·설명 등 비인터랙 영역에서 아래 스와이프 시 닫기 (옵션·수량·담기 제외) */
  useEffect(() => {
    const sheet = sheetRef.current;
    const scroll = scrollRef.current;
    if (!open || !sheet) return;

    let startY = 0;
    let startScrollTop = 0;
    let sheetDragging = false;
    let tracking = false;

    const resetTransform = () => {
      sheet.style.transition = "transform 0.22s ease";
      sheet.style.transform = "";
      window.setTimeout(() => {
        sheet.style.transition = "";
      }, 230);
    };

    const onStart = (e: TouchEvent) => {
      if (isSheetDragBlocked(e.target)) return;
      startY = e.touches[0]?.clientY ?? 0;
      startScrollTop = scroll?.scrollTop ?? 0;
      sheetDragging = false;
      tracking = true;
      sheet.style.transition = "";
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const y = e.touches[0]?.clientY ?? startY;
      const dy = y - startY;
      const atScrollTop = (scroll?.scrollTop ?? 0) <= 0;

      if (!sheetDragging) {
        if (dy <= 0 || !atScrollTop || startScrollTop > 0) return;
        sheetDragging = true;
      }

      if (sheetDragging && dy > 0) {
        sheet.style.transform = `translateY(${dy}px)`;
        e.preventDefault();
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      if (!sheetDragging) return;
      sheetDragging = false;
      const y = e.changedTouches[0]?.clientY ?? startY;
      const dy = Math.max(0, y - startY);
      if (dy > DISMISS_DRAG_PX) {
        onClose();
        sheet.style.transform = "";
        sheet.style.transition = "";
        return;
      }
      resetTransform();
    };

    sheet.addEventListener("touchstart", onStart, { passive: true });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);
    sheet.addEventListener("touchcancel", onEnd);

    return () => {
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("touchcancel", onEnd);
      sheet.style.transform = "";
      sheet.style.transition = "";
    };
  }, [open, onClose]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    const delta = selected.reduce((s, o) => s + o.priceDelta, 0);
    return item.price + delta;
  }, [item, selected]);

  const lineTotal = unitPrice * qty;

  const addToCart = () => {
    if (!item || item.isSoldOut) return;
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
    speak(m.barrierFree.addedOne.replace("{name}", item.name));
    onAdded?.();
    onClose();
  };

  if (!open || !item) return null;

  const qtySize = fontScale !== "normal" ? "size-11" : "size-8";
  const iconSize = fontScale !== "normal" ? "size-4" : "size-3.5";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-end"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-detail-sheet-title"
        className="max-h-[min(88dvh,720px)] w-full max-w-lg animate-[sheet-up_0.28s_ease-out] overflow-hidden rounded-t-3xl bg-chaya-surface shadow-2xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex justify-center pb-1 pt-2.5"
          aria-hidden
        >
          <div className="h-1 w-9 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>
        <div
          ref={scrollRef}
          className="relative max-h-[min(calc(88dvh-1.25rem),700px)] overflow-y-auto overscroll-contain"
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
            aria-label={m.menu.detailSheetClose}
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
          </button>

          {item.imageUrl?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="h-52 w-full object-cover sm:h-56" />
          ) : (
            <div
              className="flex h-44 items-center justify-center bg-gradient-to-br from-chaya-primary/10 to-zinc-100 dark:from-orange-950/40 dark:to-zinc-900"
              aria-hidden
            >
              <span className="text-5xl font-bold text-chaya-primary/40 dark:text-orange-400/50">
                {item.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="px-5 pb-6 pt-4">
            <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {item.category?.trim() || m.menu.categoryFallback}
            </span>

            {item.isSoldOut ? (
              <p
                role="status"
                className="mt-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {m.menu.soldOutBanner}
              </p>
            ) : null}

            <h2
              id="menu-detail-sheet-title"
              className="mt-2 text-xl font-extrabold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl"
            >
              {item.name}
            </h2>
            <p className="mt-1 text-lg font-bold tabular-nums text-chaya-primary dark:text-orange-400">
              {formatConsumerMoney(item.price, locale)}
            </p>

            {(item.description ?? "").trim() ? (
              <p className="mt-3 rounded-xl bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-300">
                {item.description}
              </p>
            ) : null}

            <MenuItemSpiceLine
              locale={locale}
              spiceLevel={item.spiceLevel}
              spiceAriaLabel={
                item.spiceLevel && item.spiceLevel > 0
                  ? m.menu.spiceLevelAria.replace("{level}", String(item.spiceLevel))
                  : ""
              }
            />

            <div className="mt-4" data-sheet-no-drag>
              {hasOptions ? (
                <MenuItemOptionGroups groups={item.optionGroups} selected={selected} onChange={setSelected} />
              ) : (
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{m.menu.noOptionsHint}</p>
              )}
            </div>

            {optError ? (
              <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                {optError}
              </p>
            ) : null}

            {!item.isSoldOut ? (
              <div data-sheet-no-drag>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-zinc-900/80">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{m.menu.quantity}</span>
                  <div className="flex items-center gap-3" role="group" aria-label={`${item.name} ${m.menu.quantity}`}>
                    <button
                      type="button"
                      className={`${cartQtyMinusClass} ${qtySize}`}
                      aria-label={m.menu.decreaseQty}
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      <Minus className={iconSize} aria-hidden />
                    </button>
                    <span
                      className={`min-w-8 text-center font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50 ${fontScale !== "normal" ? "text-lg" : "text-base"}`}
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      className={`${cartQtyPlusClass} ${qtySize}`}
                      aria-label={m.menu.increaseQty}
                      onClick={() => setQty((q) => Math.min(99, q + 1))}
                    >
                      <Plus className={iconSize} aria-hidden />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-xl bg-chaya-primary px-4 py-3.5 text-base font-extrabold text-chaya-on-primary shadow-sm active:opacity-90"
                  onClick={addToCart}
                >
                  {m.menu.addToCartBar} · {formatConsumerMoney(lineTotal, locale)}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
