"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { SplitBillPanel } from "@/components/split-bill-panel";
import {
  cartLineKey,
  clearCart,
  readCart,
  writeCart,
  type CartLine,
} from "@/lib/cart/local-cart";
import { CONSUMER_SPLIT_BILL_UI_VISIBLE } from "@/lib/consumer/future-features";
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

function qtyLabel(count: number, locale: string): string {
  if (locale === "ko" || locale === "ja") return `${count}개`;
  if (locale.startsWith("zh")) return `${count}件`;
  return `×${count}`;
}

export function CartCheckoutClient({ tenant, initialLines, initialTableHint }: Props) {
  const router = useRouter();
  const { locale, m } = useConsumerLocale();
  const [mounted, setMounted] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tableNo, setTableNo] = useState(
    () => (initialTableHint?.trim() ?? "").slice(0, PREF_TABLE_MAX),
  );
  const [guestNote, setGuestNote] = useState("");
  const serverFallback = useRef(initialLines);
  serverFallback.current = initialLines;
  const submitLock = useRef(false);
  const tablePrefSeeded = useRef(false);

  useEffect(() => {
    const stored = readCart(tenant);
    setLines(stored.length > 0 ? stored : serverFallback.current);
    setMounted(true);
  }, [tenant]);

  useEffect(() => {
    const hint = (initialTableHint?.trim() ?? "").slice(0, PREF_TABLE_MAX);
    if (hint) setTableNo(hint);
  }, [initialTableHint]);

  useEffect(() => {
    if (!mounted || tablePrefSeeded.current) return;
    tablePrefSeeded.current = true;
    setTableNo((prev) => {
      if (prev.trim()) return prev;
      const fromStore = readTablePref(tenant);
      return fromStore || prev;
    });
  }, [mounted, tenant]);

  useEffect(() => {
    if (!mounted) return;
    writeCart(tenant, lines);
  }, [lines, tenant, mounted]);

  const itemCount = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [lines],
  );

  const orderPayload = useMemo(
    () =>
      lines.map((line) => {
        const optNote = formatSelectedOptionsForNotes(line.selectedOptions);
        const combined =
          [optNote, line.notes].filter(Boolean).join(" · ") || null;
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

  const setQty = (index: number, quantity: number) => {
    const q = Math.max(1, Math.min(99, Math.floor(quantity)));
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, quantity: q } : l)));
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = () => {
    if (submitLock.current || lines.length === 0) return;
    submitLock.current = true;
    setError(null);
    ensureGuestSession();
    const guestSessionId =
      typeof window !== "undefined" ? localStorage.getItem(GUEST_SESSION_STORAGE_KEY) : null;

    startTransition(async () => {
      let orderSucceeded = false;
      try {
        const res = await submitGuestOrderAction(
          tenant,
          JSON.stringify(orderPayload),
          guestSessionId,
          tableNo.trim() || null,
          guestNote.trim() || null,
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
          href={withConsumerLang(`/t/${tenant}`, locale)}
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
    <div className="space-y-5 pb-[12.5rem]">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {qtyLabel(itemCount, locale)}
      </p>

      <ul className="divide-y divide-zinc-200/90 dark:divide-zinc-800" aria-label={m.cart.listLabel}>
        {lines.map((line, index) => {
          const rowKey = cartLineKey(line.id, line.selectedOptions);
          const optNote = formatSelectedOptionsForNotes(line.selectedOptions);
          const lineTotal = line.unitPrice * line.quantity;

          return (
            <li key={rowKey} className="flex gap-3 py-3.5 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                  {line.name}
                </p>
                {optNote ? <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{optNote}</p> : null}
                {line.notes && line.notes !== optNote ? (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{line.notes}</p>
                ) : null}
                <div className="mt-2.5 flex items-center gap-2" role="group" aria-label={`${line.name} ${m.cart.qtySr}`}>
                  <button
                    type="button"
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    aria-label={m.menu.decreaseQty}
                    disabled={line.quantity <= 1}
                    onClick={() => setQty(index, line.quantity - 1)}
                  >
                    <Minus className="size-4" aria-hidden />
                  </button>
                  <span className="min-w-8 text-center text-base font-semibold tabular-nums" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    aria-label={m.menu.increaseQty}
                    disabled={line.quantity >= 99}
                    onClick={() => setQty(index, line.quantity + 1)}
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="ml-1 text-xs font-medium text-zinc-400 underline-offset-2 hover:text-red-600 hover:underline dark:hover:text-red-400"
                    aria-label={`${line.name} ${m.cart.removeAria}`}
                    onClick={() => removeLine(index)}
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

      {CONSUMER_SPLIT_BILL_UI_VISIBLE ? <SplitBillPanel total={total} /> : null}

      <div className="space-y-3 border-t border-zinc-200/90 pt-4 dark:border-zinc-800">
        <input
          id="cart-table-no"
          type="text"
          inputMode="numeric"
          maxLength={PREF_TABLE_MAX}
          autoComplete="off"
          aria-label={m.cart.tableLabel}
          className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-base text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          placeholder={m.cart.tablePlaceholder}
          value={tableNo}
          onChange={(e) => setTableNo(e.target.value)}
        />
        <textarea
          id="cart-guest-note"
          rows={2}
          maxLength={500}
          aria-label={m.cart.noteLabel}
          className="min-h-[72px] w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          placeholder={m.cart.notePlaceholder}
          value={guestNote}
          onChange={(e) => setGuestNote(e.target.value)}
        />
      </div>

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
