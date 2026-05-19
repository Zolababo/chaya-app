"use client";

import { Minus, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { menuFlatListBleedClass, menuFlatListItemClass } from "@/components/menu-list-styles";
import {
  cartLineKey,
  clearCart,
  readCart,
  writeCart,
  type CartLine,
} from "@/lib/cart/local-cart";
import { groupCartLines } from "@/lib/cart/group-cart-lines";
import { formatSelectedOptionsForNotes } from "@/lib/menus/menu-options";
import { PREF_TABLE_MAX, readTablePref } from "@/lib/cart/table-pref";

import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import { syncGuestSessionCookieFromBrowser } from "@/lib/guest-session/sync-guest-session-cookie";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { resolveGuestOrderError } from "@/lib/i18n/consumer-messages-errors";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

import { submitGuestOrderAction } from "./actions";

const LAST_ORDER_KEY = "chaya_last_order_id";

const BOTTOM_DOCK =
  "fixed inset-x-0 bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3.75rem))] z-30 border-t border-zinc-200/90 bg-chaya-surface/98 px-4 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/98";

type Props = {
  tenant: string;
  initialLines: CartLine[];
  categoryOrder: string[];
  initialTableHint?: string | null;
};

function ensureGuestSession(): string {
  if (typeof window === "undefined") return "";
  try {
    let s = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (!s || s.length < 8) {
      s = crypto.randomUUID();
      localStorage.setItem(GUEST_SESSION_STORAGE_KEY, s);
    }
    syncGuestSessionCookieFromBrowser();
    return s;
  } catch {
    return "";
  }
}

function resolveTableNo(tenant: string, hint: string | null | undefined): string {
  const fromHint = (hint?.trim() ?? "").slice(0, PREF_TABLE_MAX);
  if (fromHint) return fromHint;
  return readTablePref(tenant).slice(0, PREF_TABLE_MAX);
}

export function CartCheckoutClient({
  tenant,
  initialLines,
  categoryOrder,
  initialTableHint,
}: Props) {
  const router = useRouter();
  const { locale, m } = useConsumerLocale();
  const menuHref = withConsumerLang(`/t/${tenant}`, locale);
  const [mounted, setMounted] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const serverFallback = useRef(initialLines);
  serverFallback.current = initialLines;
  const submitLock = useRef(false);

  useEffect(() => {
    const stored = readCart(tenant);
    setLines(stored.length > 0 ? stored : serverFallback.current);
    setMounted(true);
  }, [tenant]);

  useEffect(() => {
    if (!mounted) return;
    writeCart(tenant, lines);
  }, [lines, tenant, mounted]);

  const groups = useMemo(
    () => groupCartLines(lines, categoryOrder),
    [lines, categoryOrder],
  );

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [lines],
  );

  const orderPayload = useMemo(
    () =>
      groups.flatMap((group) =>
        group.lines.map((line) => {
          const optNote = formatSelectedOptionsForNotes(line.selectedOptions);
          const combined = [optNote, line.notes].filter(Boolean).join(" · ") || null;
          return {
            id: line.id,
            name: line.name,
            price: line.unitPrice,
            quantity: line.quantity,
            notes: combined,
          };
        }),
      ),
    [groups],
  );

  const changeQty = (key: string, delta: number) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => cartLineKey(l.id, l.selectedOptions) === key);
      if (idx === -1) return prev;
      const line = prev[idx];
      const nextQty = line.quantity + delta;
      if (nextQty < 1) return prev.filter((_, i) => i !== idx);
      const q = Math.min(99, nextQty);
      return prev.map((l, i) => (i === idx ? { ...l, quantity: q } : l));
    });
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => cartLineKey(l.id, l.selectedOptions) !== key));
  };

  const submit = () => {
    if (submitLock.current || lines.length === 0) return;
    submitLock.current = true;
    setError(null);
    ensureGuestSession();
    const guestSessionId =
      typeof window !== "undefined" ? localStorage.getItem(GUEST_SESSION_STORAGE_KEY) : null;
    const tableNo = resolveTableNo(tenant, initialTableHint);

    startTransition(async () => {
      let orderSucceeded = false;
      try {
        const res = await submitGuestOrderAction(
          tenant,
          JSON.stringify(orderPayload),
          guestSessionId,
          tableNo.trim() || null,
          null,
        );
        if (!res.ok) {
          setError(resolveGuestOrderError(res.code, locale, res.params));
          return;
        }
        orderSucceeded = true;
        try {
          localStorage.setItem(LAST_ORDER_KEY, res.orderId);
        } catch {
          /* ignore */
        }
        clearCart(tenant);
        router.push(withConsumerLang(`/t/${tenant}/orders/${res.orderId}`, locale));
      } finally {
        if (!orderSucceeded) submitLock.current = false;
      }
    });
  };

  if (!mounted) {
    return (
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-zinc-500">
        {m.cart.loading}
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center py-14 text-center">
        <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100">{m.cart.empty}</p>
        <a
          href={menuHref}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-chaya-primary px-7 text-sm font-bold text-chaya-on-primary"
          aria-label={m.cart.emptyCtaAria}
        >
          {m.cart.emptyCta}
        </a>
      </div>
    );
  }

  return (
    <>
      <ul className={`${menuFlatListBleedClass} pb-[9.5rem]`} aria-label={m.cart.listLabel}>
        {groups.map((group, gi) => (
          <li key={group.category} className="list-none">
            <p
              className={`sticky top-0 z-10 bg-chaya-bg/95 py-1.5 text-[11px] font-bold tracking-wide text-zinc-500 backdrop-blur-sm dark:bg-zinc-950/95 dark:text-zinc-400 ${menuFlatListItemClass}`}
            >
              {group.category}
            </p>
            <ul className="list-none">
              {group.lines.map((line) => {
                const key = cartLineKey(line.id, line.selectedOptions);
                const optNote = formatSelectedOptionsForNotes(line.selectedOptions);
                const lineTotal = line.unitPrice * line.quantity;

                return (
                  <li
                    key={key}
                    className={`flex items-center gap-2 py-2 sm:gap-2.5 ${menuFlatListItemClass}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9375rem] font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
                        {line.name}
                        {line.quantity > 1 ? (
                          <span className="ml-1 text-xs font-medium text-zinc-500">×{line.quantity}</span>
                        ) : null}
                      </p>
                      {optNote ? (
                        <p className="truncate text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                          {optNote}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5" role="group" aria-label={`${line.name} ${m.cart.qtySr}`}>
                      <button
                        type="button"
                        className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800"
                        aria-label={line.quantity <= 1 ? `${line.name} ${m.cart.removeAria}` : m.menu.decreaseQty}
                        onClick={() => changeQty(key, -1)}
                      >
                        <Minus className="size-3.5" aria-hidden />
                      </button>
                      <span className="min-w-[1.25rem] text-center text-sm font-semibold tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full text-zinc-600 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800"
                        aria-label={m.menu.increaseQty}
                        disabled={line.quantity >= 99}
                        onClick={() => changeQty(key, 1)}
                      >
                        <Plus className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    <p className="w-[4.25rem] shrink-0 text-right text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatConsumerMoney(lineTotal, locale)}
                    </p>
                    <button
                      type="button"
                      className="flex min-h-[32px] min-w-[28px] items-center justify-center text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                      aria-label={`${line.name} ${m.cart.removeAria}`}
                      onClick={() => removeLine(key)}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
            {gi < groups.length - 1 ? (
              <div className={`${menuFlatListItemClass} pb-0.5`} aria-hidden>
                <div className="h-px bg-zinc-200/80 dark:bg-zinc-800" />
              </div>
            ) : null}
          </li>
        ))}
        <li className={`list-none py-2 ${menuFlatListItemClass}`}>
          <Link
            href={menuHref}
            className="flex min-h-[40px] items-center justify-center rounded-lg border border-dashed border-zinc-300/80 bg-zinc-100/90 text-xs font-semibold text-chaya-primary dark:border-zinc-600/80 dark:bg-zinc-800/60 dark:text-orange-400"
            aria-label={m.cart.addMoreMenuAria}
          >
            {m.cart.addMoreMenu}
          </Link>
        </li>
      </ul>

      {error ? (
        <p
          className="-mt-6 mb-2 px-4 text-sm font-medium text-red-600 dark:text-red-400 sm:px-6"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      ) : null}

      <p id="checkout-guest-order-hint" className="sr-only">
        {m.cart.submitHint}
      </p>

      <div className={BOTTOM_DOCK}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{m.cart.total}</p>
            <p className="text-xl font-bold tabular-nums leading-tight text-chaya-primary dark:text-orange-400">
              {formatConsumerMoney(total, locale)}
            </p>
          </div>
          <button
            type="button"
            className="min-h-[48px] shrink-0 rounded-2xl bg-chaya-primary px-6 text-base font-bold text-chaya-on-primary shadow-[0_4px_16px_rgba(164,55,0,0.22)] active:scale-[0.99] disabled:opacity-60"
            disabled={pending}
            aria-busy={pending}
            aria-describedby="checkout-guest-order-hint"
            aria-label={
              pending
                ? m.cart.submitAriaPending
                : `${m.cart.total} ${formatConsumerMoney(total, locale)}, ${m.cart.submit}`
            }
            onClick={submit}
          >
            {pending ? m.cart.submitPending : m.cart.submit}
          </button>
        </div>
      </div>
    </>
  );
}
