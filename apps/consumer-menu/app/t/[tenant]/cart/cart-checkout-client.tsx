"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { CartLineItem } from "@/components/cart-line-item";
import { CartUndoToast } from "@/components/cart-undo-toast";
import { ConsumerEmptyState } from "@/components/consumer-empty-state";
import { ConsumerLoadingCenter } from "@/components/consumer-loading-center";
import { ConsumerOfflinePaymentCallout } from "@/components/consumer-offline-payment-callout";
import { ConsumerTableField } from "@/components/consumer-table-field";
import {
  chayaConsumerContentClass,
} from "@/lib/responsive/chaya-app-shell";
import {
  cartCategoryLabelEasyClass,
  cartSheetFooterClass,
  cartSheetFooterEasyClass,
  cartSubmitButtonClass,
  cartSubmitButtonEasyClass,
  chayaPrimaryButtonClass,
  menuCardItemClass,
} from "@/components/menu-list-styles";
import {
  cartLineKey,
  clearCart,
  readCart,
  writeCart,
  type CartLine,
} from "@/lib/cart/local-cart";
import { groupCartLines } from "@/lib/cart/group-cart-lines";
import { useTenantTableSelection } from "@/lib/cart/use-tenant-table-selection";
import { formatSelectedOptionsForNotes } from "@/lib/menus/menu-options";

import {
  ensureGuestSessionInBrowser,
  readGuestSessionFromBrowser,
} from "@/lib/guest-session/ensure-guest-session";

import { readTableQrTokenPref } from "@/lib/cart/table-qr-token-pref";

import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useEasyMenuHref } from "@/lib/consumer/use-easy-menu-href";
import { useConsumerVoiceAnnounce } from "@/lib/consumer/use-consumer-voice-announce";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { resolveGuestOrderError } from "@/lib/i18n/consumer-messages-errors";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";

import { markFreshOrderView } from "@/lib/consumer/fresh-order-view";

import { submitGuestOrderAction } from "./actions";

const LAST_ORDER_KEY = "chaya_last_order_id";

type Props = {
  tenant: string;
  initialLines: CartLine[];
  categoryOrder: string[];
};

export function CartCheckoutClient({
  tenant,
  initialLines,
  categoryOrder,
}: Props) {
  const router = useRouter();
  const { locale, m } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();
  const { speak } = useConsumerVoiceAnnounce();
  const menuHref = useEasyMenuHref(tenant);
  const navHref = useConsumerNavHref(tenant);
  const tableSelection = useTenantTableSelection(tenant);
  const showTableAlert = tableSelection.hasRegistry && !tableSelection.isLocked;
  const [mounted, setMounted] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [undoMessage, setUndoMessage] = useState("");
  const undoBackup = useRef<{ line: CartLine; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const groups = useMemo(
    () => groupCartLines(lines, categoryOrder),
    [lines, categoryOrder],
  );

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [lines],
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
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
    setLines((prev) => {
      const idx = prev.findIndex((l) => cartLineKey(l.id, l.selectedOptions) === key);
      if (idx === -1) return prev;
      undoBackup.current = { line: prev[idx], index: idx };
      setUndoMessage(m.cart.undoRemoved.replace("{name}", prev[idx].name));
      setUndoVisible(true);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => {
        undoBackup.current = null;
        setUndoVisible(false);
      }, 3500);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const undoRemove = () => {
    const backup = undoBackup.current;
    if (!backup) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoBackup.current = null;
    setUndoVisible(false);
    setLines((prev) => {
      const next = [...prev];
      next.splice(Math.min(backup.index, next.length), 0, backup.line);
      return next;
    });
  };

  const submit = () => {
    if (submitLock.current || lines.length === 0) return;
    if (tableSelection.hasRegistry && tableSelection.needsPick) {
      const msg = m.cart.tableQrRequired;
      setError(msg);
      speak(msg);
      return;
    }
    submitLock.current = true;
    setError(null);
    ensureGuestSessionInBrowser();
    const guestSessionId = readGuestSessionFromBrowser();
    const tableNo = tableSelection.effectiveCode;
    const qrPref = readTableQrTokenPref(tenant);
    const qrForTable =
      qrPref && tableNo.trim() && qrPref.table === tableNo.trim()
        ? { exp: qrPref.exp, sig: qrPref.sig }
        : { exp: null, sig: null };

    startTransition(async () => {
      let orderSucceeded = false;
      try {
        const res = await submitGuestOrderAction(
          tenant,
          JSON.stringify(orderPayload),
          guestSessionId,
          tableNo.trim() || null,
          null,
          qrForTable.exp,
          qrForTable.sig,
        );
        if (!res.ok) {
          const msg = resolveGuestOrderError(res.code, locale, res.params);
          setError(msg);
          speak(msg);
          return;
        }
        orderSucceeded = true;
        try {
          localStorage.setItem(LAST_ORDER_KEY, res.orderId);
        } catch {
          /* ignore */
        }
        clearCart(tenant);
        markFreshOrderView(tenant, res.orderId, res.orderNo);
        router.push(navHref(`/t/${tenant}/orders/${res.orderId}`));
      } finally {
        if (!orderSucceeded) submitLock.current = false;
      }
    });
  };

  if (!mounted) {
    return <ConsumerLoadingCenter label={m.cart.loading} easyMode={easyMode} />;
  }

  if (lines.length === 0) {
    return (
      <ConsumerEmptyState
        easyMode={easyMode}
        icon={<ShoppingCart className="size-7 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} />}
        message={m.cart.empty}
        action={
          <a
            href={menuHref}
            className={`${chayaPrimaryButtonClass} px-8 ${easyMode ? "min-h-[48px]" : "min-h-[44px]"}`}
            aria-label={m.cart.emptyCtaAria}
          >
            {m.cart.emptyCta}
          </a>
        }
      />
    );
  }

  const selectedParts = m.cart.selectedMenuLabel.split("{count}");
  const listClass = easyMode ? "space-y-3 px-4 sm:px-6" : "space-y-2 px-4 sm:px-6";
  const scrollClearance = easyMode ? "pb-[12.5rem]" : "pb-[11.5rem]";

  return (
    <>
      <div className={`${chayaConsumerContentClass} ${scrollClearance}`}>
        <p
          className={
            easyMode
              ? "mb-3 text-lg font-bold text-zinc-800 dark:text-zinc-100"
              : "mb-2 px-0 font-semibold text-zinc-800 dark:text-zinc-100 text-sm"
          }
        >
          {selectedParts[0]}
          <span
            className={
              easyMode
                ? "text-2xl font-bold tabular-nums text-chaya-primary dark:text-orange-400"
                : "text-lg font-bold tabular-nums text-chaya-primary dark:text-orange-400"
            }
          >
            {itemCount}
          </span>
          {selectedParts[1] ?? ""}
        </p>
        <ul className={listClass} aria-label={m.cart.listLabel}>
          {groups.map((group) => (
            <li key={group.category} className="list-none space-y-2">
              <p
                className={
                  easyMode
                    ? cartCategoryLabelEasyClass
                    : "text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400"
                }
              >
                {group.category}
              </p>
              <ul className={`list-none ${easyMode ? "space-y-3" : "space-y-2"}`}>
                {group.lines.map((line) => {
                  const key = cartLineKey(line.id, line.selectedOptions);
                  return (
                    <CartLineItem
                      key={key}
                      line={line}
                      lineKey={key}
                      locale={locale}
                      m={m}
                      easyMode={easyMode}
                      onChangeQty={changeQty}
                      onRemove={removeLine}
                    />
                  );
                })}
              </ul>
            </li>
          ))}
          <li className="list-none">
            <Link
              href={menuHref}
              className={
                easyMode
                  ? `${menuCardItemClass} flex min-h-[52px] items-center justify-center px-4 text-base font-bold text-chaya-primary dark:text-orange-400`
                  : "flex min-h-[44px] items-center justify-center rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50 text-xs font-semibold text-chaya-primary dark:border-zinc-600/80 dark:bg-zinc-900/60 dark:text-orange-400"
              }
              aria-label={m.cart.addMoreMenuAria}
            >
              {m.cart.addMoreMenu}
            </Link>
          </li>
        </ul>

        {showTableAlert ? (
          <section className="mt-4 space-y-3" aria-label={m.cart.tableLabel}>
            <ConsumerTableField tenant={tenant} easyMode={easyMode} />
          </section>
        ) : null}

        {error ? (
          <p
            className="mt-3 text-sm font-medium text-red-600 dark:text-red-400"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        ) : null}
      </div>

      <p id="checkout-guest-order-hint" className="sr-only">
        {m.cart.submitHint}
      </p>

      <div className={easyMode ? cartSheetFooterEasyClass : cartSheetFooterClass}>
        <div className={`${chayaConsumerContentClass} space-y-2.5`}>
          <ConsumerOfflinePaymentCallout variant="prominent" />
          <div className={`flex items-center justify-between ${easyMode ? "gap-3" : ""}`}>
            <span
              className={
                easyMode
                  ? "text-lg font-semibold text-zinc-600 dark:text-zinc-400"
                  : "text-sm font-semibold text-zinc-600 dark:text-zinc-400"
              }
            >
              {m.cart.paymentExpected}
            </span>
            <span
              className={
                easyMode
                  ? "text-2xl font-bold tabular-nums text-chaya-primary dark:text-orange-400"
                  : "text-xl font-extrabold tabular-nums text-chaya-primary dark:text-orange-400"
              }
            >
              {formatConsumerMoney(total, locale)}
            </span>
          </div>
          <button
            type="button"
            className={easyMode ? cartSubmitButtonEasyClass : cartSubmitButtonClass}
            disabled={pending}
            aria-busy={pending}
            aria-describedby="checkout-guest-order-hint"
            aria-label={
              pending
                ? m.cart.submitAriaPending
                : `${m.cart.paymentExpected} ${formatConsumerMoney(total, locale)}, ${m.cart.submit}`
            }
            onClick={submit}
          >
            {pending ? m.cart.submitPending : m.cart.submit}
          </button>
        </div>
      </div>

      <CartUndoToast
        message={undoMessage}
        actionLabel={m.cart.undoAction}
        visible={undoVisible}
        onUndo={undoRemove}
      />
    </>
  );
}
