"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";

import { GuestOrderRowCopyLinkButton } from "@/components/guest-order-row-copy-link-button";
import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import type { GuestOrderListItem } from "@/lib/orders/list-guest-orders";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { orderStatusLabelForLocale } from "@/lib/i18n/order-status-for-locale";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

import { ORDER_STATUS_POLL_MS } from "@/lib/orders/status-poll";

import { listGuestOrdersAction, listUserOrdersAction } from "./actions";

type Props = {
  tenant: string;
  loggedIn?: boolean;
  initialAccountOrders?: GuestOrderListItem[];
  accountLoadError?: "no_client" | "no_user" | "rpc" | null;
};

function OrderList({
  tenant,
  orders,
  listLabel,
  locale,
  m,
}: {
  tenant: string;
  orders: GuestOrderListItem[];
  listLabel: string;
  locale: ReturnType<typeof useConsumerLocale>["locale"];
  m: ReturnType<typeof useConsumerLocale>["m"];
}) {
  return (
    <ul
      className="divide-y divide-chaya-border rounded-xl border border-chaya-border dark:divide-zinc-800 dark:border-zinc-700"
      aria-label={listLabel}
    >
      {orders.map((o) => (
        <li key={o.id}>
          <div className="divide-y divide-chaya-border dark:divide-zinc-800">
            <Link
              href={withConsumerLang(`/t/${tenant}/orders/${o.id}`, locale)}
              aria-label={`${o.id.slice(0, 8)}, ${orderStatusLabelForLocale(o.status, locale)}, ${formatConsumerMoney(o.total_price, locale)}, ${m.orders.orderLinkAria}`}
              className="flex min-h-[44px] flex-col gap-1 px-4 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {o.id.slice(0, 8)}…
                </p>
                {o.created_at ? (
                  <p className="text-xs text-zinc-500">{new Date(o.created_at).toLocaleString("ko-KR")}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="inline-flex rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  {orderStatusLabelForLocale(o.status, locale)}
                </span>
                <span className="text-sm font-semibold tabular-nums text-chaya-primary dark:text-orange-400">
                  {formatConsumerMoney(o.total_price, locale)}
                </span>
              </div>
            </Link>
            <div className="bg-zinc-50/80 px-4 py-2 dark:bg-zinc-900/30">
              <GuestOrderRowCopyLinkButton tenant={tenant} orderId={o.id} orderLabelShort={o.id.slice(0, 8)} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function GuestOrdersHub({
  tenant,
  loggedIn = false,
  initialAccountOrders = [],
  accountLoadError = null,
}: Props) {
  const { locale, m } = useConsumerLocale();
  const [orders, setOrders] = useState<GuestOrderListItem[] | null>(null);
  const [accountOrders, setAccountOrders] = useState<GuestOrderListItem[]>(initialAccountOrders);
  const [noSession, setNoSession] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [reducedMotion, setReducedMotion] = useState(false);

  const load = useCallback(() => {
    if (typeof window === "undefined") return;
    let sid: string | null = null;
    try {
      sid = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    } catch {
      setNoSession(true);
      setOrders([]);
      setLoadError(null);
    }
    if (!sid || sid.length < 8) {
      setNoSession(true);
      setOrders([]);
      setLoadError(null);
    } else {
      setNoSession(false);
    }

    startTransition(async () => {
      if (loggedIn) {
        const accountRes = await listUserOrdersAction(tenant);
        if (accountRes.ok) setAccountOrders(accountRes.orders);
      }

      if (!sid || sid.length < 8) return;

      const res = await listGuestOrdersAction(tenant, sid);
      if (res.ok) {
        setLoadError(null);
        setOrders(res.orders);
        return;
      }
      setOrders([]);
      if (res.errorKind === "no_client") {
        setLoadError(m.orders.loadErrorNoClient);
      } else {
        setLoadError(m.orders.loadErrorRpc);
      }
    });
  }, [tenant, loggedIn, m.orders.loadErrorNoClient, m.orders.loadErrorRpc]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [load]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || (noSession && !loggedIn)) return;
    const id = window.setInterval(() => load(), ORDER_STATUS_POLL_MS);
    return () => window.clearInterval(id);
  }, [load, reducedMotion, noSession, loggedIn]);

  if (orders === null) {
    return (
      <p
        role="status"
        aria-live="polite"
        aria-busy={pending}
        className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
      >
        {pending ? m.orders.loading : m.orders.preparing}
      </p>
    );
  }

  return (
    <section className="space-y-6" aria-label={m.orders.hubLabel}>
      {loadError ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => load()}
            className="mt-2 min-h-[44px] font-semibold underline-offset-2 hover:underline"
          >
            {m.orders.retry}
          </button>
        </div>
      ) : null}

      {!loadError && !noSession && orders !== null && orders.length > 0 && !reducedMotion ? (
        <p className="text-center text-xs text-zinc-500" role="status" aria-live="polite">
          {m.orders.pollNote.replace("{seconds}", String(Math.round(ORDER_STATUS_POLL_MS / 1000)))}
        </p>
      ) : null}

      {noSession ? (
        <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-4 text-left text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          {m.orders.noSession}
        </p>
      ) : null}

      {!loadError && !noSession && orders.length === 0 ? (
        <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-4 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          {m.orders.empty}
        </p>
      ) : null}

      {loggedIn && accountLoadError === "rpc" ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {m.orders.accountRpcError}
        </p>
      ) : null}

      {loggedIn && accountOrders.length === 0 && !accountLoadError ? (
        <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          {m.orders.accountEmpty}
        </p>
      ) : null}

      {loggedIn && accountOrders.length > 0 ? (
        <section className="space-y-2" aria-labelledby="account-orders-heading">
          <h2 id="account-orders-heading" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {m.orders.accountHeading}
          </h2>
          <OrderList
            tenant={tenant}
            orders={accountOrders}
            listLabel={m.orders.accountListLabel}
            locale={locale}
            m={m}
          />
        </section>
      ) : null}

      {orders.length > 0 ? (
        <section className="space-y-2" aria-labelledby="guest-orders-heading">
          <h2 id="guest-orders-heading" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {m.orders.guestHeading}
          </h2>
          <OrderList
            tenant={tenant}
            orders={orders}
            listLabel={m.orders.guestListLabel}
            locale={locale}
            m={m}
          />
        </section>
      ) : null}

      <nav className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center" aria-label={m.orders.hubLabel}>
        <Link
          href={withConsumerLang(`/t/${tenant}`, locale)}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-4 py-3 text-center font-semibold text-chaya-primary dark:border-zinc-700"
          aria-label={m.orders.toMenuAria}
        >
          {m.orders.toMenu}
        </Link>
        <Link
          href={withConsumerLang(`/t/${tenant}/cart`, locale)}
          className="flex min-h-[48px] items-center justify-center rounded-xl bg-chaya-primary px-4 py-3 text-center font-semibold text-chaya-on-primary"
          aria-label={m.orders.toCartAria}
        >
          {m.orders.toCart}
        </Link>
        <Link
          href={withConsumerLang(`/t/${tenant}/barrier-free`, locale)}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-4 py-3 text-center font-semibold text-chaya-primary dark:border-zinc-700"
          aria-label={m.orders.toBarrierFreeAria}
        >
          {m.orders.toBarrierFree}
        </Link>
      </nav>
    </section>
  );
}
