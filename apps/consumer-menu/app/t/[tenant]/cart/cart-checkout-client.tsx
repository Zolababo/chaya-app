"use client";

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

import { ConsumerOfflinePaymentCallout } from "@/components/consumer-offline-payment-callout";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

import { submitGuestOrderAction } from "./actions";

/** 주문 제출은 게스트 서버 액션. 온라인 결제는 `future-features` 플래그·스텁만 유지(당분간 미사용). */
const LAST_ORDER_KEY = "chaya_last_order_id";

type Props = {
  tenant: string;
  initialLines: CartLine[];
  /** `/cart?table=` 또는 이전 페이지에서 저장된 QR 테이블 힌트 */
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
  /** 연속 클릭·빠른 더블 탭으로 동일 주문이 두 번 나가지 않도록 */
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
          setError(res.message);
          return;
        }
        orderSucceeded = true;
        try {
          localStorage.setItem(LAST_ORDER_KEY, res.orderId);
        } catch {
          /* ignore quota / private mode */
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
      <p
        role="status"
        aria-live="polite"
        className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
      >
        {m.cart.loading}
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-chaya-border bg-chaya-surface p-6 dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">{m.cart.empty}</p>
        <a
          href={withConsumerLang(`/t/${tenant}`, locale)}
          className="mt-4 inline-block min-h-[44px] min-w-[44px] py-3 font-semibold text-chaya-primary underline-offset-4 hover:underline"
          aria-label={m.cart.emptyCtaAria}
        >
          {m.cart.emptyCta}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul
        className="divide-y divide-chaya-border rounded-xl border border-chaya-border dark:divide-zinc-800 dark:border-zinc-700"
        aria-label={m.cart.listLabel}
      >
        {lines.map((line, index) => {
          const rowKey = cartLineKey(line.id, line.selectedOptions);
          const optNote = formatSelectedOptionsForNotes(line.selectedOptions);
          return (
          <li key={rowKey} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{line.name}</p>
              {optNote ? <p className="text-xs text-zinc-500">{optNote}</p> : null}
              {line.notes && line.notes !== optNote ? (
                <p className="text-xs text-zinc-500">{line.notes}</p>
              ) : null}
              <p className="text-sm text-zinc-500">
                {m.cart.lineTotal} {formatConsumerMoney(line.unitPrice * line.quantity, locale)}{" "}
                <span className="text-zinc-400">
                  ({m.cart.unitPrice} {formatConsumerMoney(line.unitPrice, locale)} {m.cart.multiply}{" "}
                  {line.quantity}
                  {m.cart.each ? ` ${m.cart.each}` : ""})
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="sr-only" htmlFor={`qty-${rowKey}`}>
                {line.name} {m.cart.qtySr}
              </label>
              <input
                id={`qty-${rowKey}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                className="min-h-[44px] w-24 rounded-lg border border-chaya-border bg-white px-2 py-2 text-center text-base dark:border-zinc-700 dark:bg-zinc-900"
                value={line.quantity}
                onChange={(e) => setQty(index, Number(e.target.value))}
              />
              <button
                type="button"
                className="min-h-[44px] rounded-lg px-3 text-sm font-semibold text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                aria-label={`${line.name} ${m.cart.removeAria}`}
                onClick={() => removeLine(index)}
              >
                {m.cart.remove}
              </button>
            </div>
          </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between rounded-xl border border-chaya-border bg-chaya-surface px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950">
        <span className="font-medium text-zinc-600 dark:text-zinc-400">{m.cart.total}</span>
        <span className="text-lg font-bold">{formatConsumerMoney(total, locale)}</span>
      </div>

      {CONSUMER_SPLIT_BILL_UI_VISIBLE ? <SplitBillPanel total={total} /> : null}

      <div className="space-y-4 rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <div>
          <label htmlFor="cart-table-no" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {m.cart.tableLabel} <span className="font-normal text-zinc-500">{m.cart.optional}</span>
          </label>
          <input
            id="cart-table-no"
            type="text"
            inputMode="numeric"
            maxLength={PREF_TABLE_MAX}
            autoComplete="off"
            className="mt-1 min-h-[44px] w-full rounded-lg border border-chaya-border bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder={m.cart.tablePlaceholder}
            value={tableNo}
            onChange={(e) => setTableNo(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="cart-guest-note" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {m.cart.noteLabel} <span className="font-normal text-zinc-500">{m.cart.optional}</span>
          </label>
          <textarea
            id="cart-guest-note"
            rows={3}
            maxLength={500}
            aria-describedby="cart-guest-note-count"
            className="mt-1 min-h-[88px] w-full resize-y rounded-lg border border-chaya-border bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder={m.cart.notePlaceholder}
            value={guestNote}
            onChange={(e) => setGuestNote(e.target.value)}
          />
          <p id="cart-guest-note-count" className="mt-1 text-right text-xs text-zinc-400">
            {m.cart.noteCount.replace("{count}", String(guestNote.length))}
          </p>
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      <ConsumerOfflinePaymentCallout />

      <p id="checkout-guest-order-hint" className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {m.cart.submitHint}
      </p>

      <button
        type="button"
        className="min-h-[48px] w-full rounded-2xl bg-chaya-primary py-4 text-lg font-bold text-chaya-on-primary shadow-sm transition hover:opacity-95 disabled:opacity-60"
        disabled={pending || lines.length === 0}
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

      <p className="text-center text-xs text-zinc-500">{m.cart.storageNote}</p>
    </div>
  );
}
