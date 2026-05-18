"use client";

import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

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
  "fixed inset-x-0 bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3.75rem))] z-30 border-t border-zinc-200/90 bg-chaya-surface/98 px-4 pb-3 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/98";

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
      lines.map((line) => {
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
    [lines],
  );

  const updateQty = (key: string, quantity: number) => {
    const q = Math.max(1, Math.min(99, Math.floor(quantity)));
    setLines((prev) =>
      prev.map((l) => (cartLineKey(l.id, l.selectedOptions) === key ? { ...l, quantity: q } : l)),
    );
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
      <p role="status" aria-live="polite" className="py-12 text-center text-sm text-zinc-500">
        {m.cart.loading}
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">{m.cart.empty}</p>
        <a
          href={menuHref}
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-chaya-primary px-8 text-base font-bold text-chaya-on-primary shadow-md hover:bg-chaya-primary-hover"
          aria-label={m.cart.emptyCtaAria}
        >
          {m.cart.emptyCta}
        </a>
      </div>
    );
  }

  const payNote = [m.payment.offlineLead, m.payment.offlineRest].filter(Boolean).join(" ");

  return (
    <>
      <div className="space-y-6 pb-[12.5rem]">
        {groups.map((group) => (
          <section key={group.category} aria-label={group.category}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {group.category}
            </h2>
            <ul className="divide-y divide-zinc-200/90 rounded-xl border border-zinc-200/90 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
              {group.lines.map((line) => {
                const key = cartLineKey(line.id, line.selectedOptions);
                const optNote = formatSelectedOptionsForNotes(line.selectedOptions);
                const lineTotal = line.unitPrice * line.quantity;

                return (
                  <li key={key} className="flex gap-3 px-3.5 py-3.5 first:rounded-t-xl last:rounded-b-xl">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                        {line.name}
                      </p>
                      {optNote ? (
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{optNote}</p>
                      ) : null}
                      {line.notes && line.notes !== optNote ? (
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{line.notes}</p>
                      ) : null}
                      <div
                        className="mt-2.5 flex items-center gap-2"
                        role="group"
                        aria-label={`${line.name} ${m.cart.qtySr}`}
                      >
                        <button
                          type="button"
                          className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          aria-label={m.menu.decreaseQty}
                          disabled={line.quantity <= 1}
                          onClick={() => updateQty(key, line.quantity - 1)}
                        >
                          <Minus className="size-4" aria-hidden />
                        </button>
                        <span
                          className="min-w-8 text-center text-base font-semibold tabular-nums"
                          aria-live="polite"
                        >
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          aria-label={m.menu.increaseQty}
                          disabled={line.quantity >= 99}
                          onClick={() => updateQty(key, line.quantity + 1)}
                        >
                          <Plus className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="ml-1 text-xs font-medium text-zinc-400 underline-offset-2 hover:text-red-600 hover:underline dark:hover:text-red-400"
                          aria-label={`${line.name} ${m.cart.removeAria}`}
                          onClick={() => removeLine(key)}
                        >
                          {m.cart.remove}
                        </button>
                      </div>
                    </div>
                    <p className="shrink-0 text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatConsumerMoney(lineTotal, locale)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <Link
          href={menuHref}
          className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm font-semibold text-chaya-primary dark:border-zinc-600 dark:text-orange-400"
          aria-label={m.cart.addMoreMenuAria}
        >
          {m.cart.addMoreMenu}
        </Link>

        {error ? (
          <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <p id="checkout-guest-order-hint" className="sr-only">
          {m.cart.submitHint}
        </p>
      </div>

      <div className={BOTTOM_DOCK}>
        {payNote ? (
          <p className="mb-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">{payNote}</p>
        ) : null}
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{m.cart.total}</span>
          <span className="text-2xl font-bold tabular-nums tracking-tight text-chaya-primary dark:text-orange-400">
            {formatConsumerMoney(total, locale)}
          </span>
        </div>
        <button
          type="button"
          className="min-h-[52px] w-full rounded-2xl bg-chaya-primary py-3.5 text-lg font-bold text-chaya-on-primary shadow-[0_6px_20px_rgba(164,55,0,0.25)] transition hover:bg-chaya-primary-hover active:scale-[0.99] disabled:opacity-60"
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
    </>
  );
}
