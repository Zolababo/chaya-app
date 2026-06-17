"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { ClipboardList } from "lucide-react";
import Link from "next/link";

import { ConsumerEmptyState } from "@/components/consumer-empty-state";
import { ConsumerLoadingCenter } from "@/components/consumer-loading-center";
import { GuestOrderHistoryCard } from "@/components/guest-order-history-card";
import { chayaPrimaryButtonClass, orderCardListClass } from "@/components/menu-list-styles";
import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import {
  isCancelledConsumerOrderStatus,
  shouldShowCancelledConsumerOrder,
} from "@/lib/consumer/consumer-cancelled-order-display";
import type { GuestOrderListItem } from "@/lib/orders/list-guest-orders";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useEasyMenuHref } from "@/lib/consumer/use-easy-menu-href";
import { useConsumerVoiceAnnounce } from "@/lib/consumer/use-consumer-voice-announce";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { orderStatusLabelForLocale } from "@/lib/i18n/order-status-for-locale";

import { ORDER_STATUS_POLL_MS } from "@/lib/orders/status-poll";

import { listGuestOrdersAction, listUserOrdersAction } from "./actions";

type LoadOptions = {
  skipGuest?: boolean;
  skipAccount?: boolean;
};

type Props = {
  tenant: string;
  loggedIn?: boolean;
  initialAccountOrders?: GuestOrderListItem[];
  initialGuestOrders?: GuestOrderListItem[];
  ssrAccountOrdersHydrated?: boolean;
  ssrGuestOrdersHydrated?: boolean;
};

const ACTIVE_STATUSES = new Set(["pending", "accepted", "preparing", "ready"]);

function isActiveConsumerOrder(o: GuestOrderListItem): boolean {
  return ACTIVE_STATUSES.has(o.status);
}

/** RPC 전체(완료 포함) — 방문 종료·취소 노출 판단용 */
function mergeAllOrdersList(
  guest: GuestOrderListItem[],
  account: GuestOrderListItem[],
): GuestOrderListItem[] {
  const byId = new Map<string, GuestOrderListItem>();
  for (const o of account) byId.set(o.id, o);
  for (const o of guest) byId.set(o.id, o);
  return [...byId.values()].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return tb - ta;
  });
}

function partitionConsumerOrders(allOrders: GuestOrderListItem[]) {
  const active: GuestOrderListItem[] = [];
  const cancelled: GuestOrderListItem[] = [];
  for (const o of allOrders) {
    if (isActiveConsumerOrder(o)) active.push(o);
    else if (shouldShowCancelledConsumerOrder(o, allOrders)) cancelled.push(o);
  }
  return { active, cancelled };
}

function sumOrderTotals(orders: GuestOrderListItem[]): number {
  return orders.reduce((sum, o) => sum + (Number.isFinite(o.total_price) ? o.total_price : 0), 0);
}

export function GuestOrdersHub({
  tenant,
  loggedIn = false,
  initialAccountOrders = [],
  initialGuestOrders = [],
  ssrAccountOrdersHydrated = false,
  ssrGuestOrdersHydrated = false,
}: Props) {
  const { locale, m } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();
  const menuHref = useEasyMenuHref(tenant);
  const { speak } = useConsumerVoiceAnnounce();
  const statusSpokenRef = useRef<Map<string, string>>(new Map());
  const hubSummarySpokenRef = useRef(false);
  const [orders, setOrders] = useState<GuestOrderListItem[] | null>(
    ssrGuestOrdersHydrated ? initialGuestOrders : null,
  );
  const [accountOrders, setAccountOrders] = useState<GuestOrderListItem[]>(initialAccountOrders);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [reducedMotion, setReducedMotion] = useState(false);
  const mountHydrationRef = useRef({
    skipGuest: ssrGuestOrdersHydrated,
    skipAccount: loggedIn && ssrAccountOrdersHydrated,
  });

  const load = useCallback(
    (options?: LoadOptions) => {
      if (typeof window === "undefined") return;
      let sid: string | null = null;
      try {
        sid = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
      } catch {
        setOrders([]);
        setLoadError(null);
        return;
      }

      startTransition(async () => {
        if (loggedIn && !options?.skipAccount) {
          const accountRes = await listUserOrdersAction(tenant, locale);
          if (accountRes.ok) setAccountOrders(accountRes.orders);
        }

        if (options?.skipGuest) {
          setLoadError(null);
          return;
        }

        if (!sid || sid.length < 8) {
          setOrders([]);
          setLoadError(null);
          return;
        }

        const res = await listGuestOrdersAction(tenant, sid, locale);
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
    },
    [tenant, loggedIn, locale, m.orders.loadErrorNoClient, m.orders.loadErrorRpc],
  );

  useEffect(() => {
    const { skipGuest, skipAccount } = mountHydrationRef.current;
    mountHydrationRef.current = { skipGuest: false, skipAccount: false };
    load({ skipGuest, skipAccount });
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
    if (reducedMotion) return;
    const id = window.setInterval(() => load(), ORDER_STATUS_POLL_MS);
    return () => window.clearInterval(id);
  }, [load, reducedMotion]);

  const allOrders = useMemo(
    () => mergeAllOrdersList(orders ?? [], accountOrders),
    [orders, accountOrders],
  );

  const { active: activeOrders, cancelled: cancelledOrders } = useMemo(
    () => partitionConsumerOrders(allOrders),
    [allOrders],
  );

  const visibleOrderCount = activeOrders.length + cancelledOrders.length;

  const visitTotal = useMemo(() => sumOrderTotals(activeOrders), [activeOrders]);

  useEffect(() => {
    if (orders === null || hubSummarySpokenRef.current) return;
    hubSummarySpokenRef.current = true;
    if (activeOrders.length === 0) return;
    const totalText = formatConsumerMoney(visitTotal, locale);
    speak(
      m.barrierFree.voiceOrdersHubSummary
        .replace("{count}", String(activeOrders.length))
        .replace("{total}", totalText),
    );
  }, [activeOrders.length, locale, m.barrierFree.voiceOrdersHubSummary, orders, speak, visitTotal]);

  useEffect(() => {
    for (const o of allOrders) {
      const prev = statusSpokenRef.current.get(o.id);
      if (prev === o.status) continue;
      if (prev != null && prev !== o.status) {
        if (isCancelledConsumerOrderStatus(o.status)) {
          speak(m.progress.cancelled);
        } else {
          const label = orderStatusLabelForLocale(o.status, locale);
          speak(m.barrierFree.voiceOrderStatus.replace("{status}", label));
        }
      }
      statusSpokenRef.current.set(o.id, o.status);
    }
  }, [allOrders, locale, m.barrierFree.voiceOrderStatus, m.progress.cancelled, speak]);

  if (orders === null) {
    return (
      <ConsumerLoadingCenter
        label={pending ? m.orders.loading : m.orders.preparing}
        easyMode={easyMode}
      />
    );
  }

  if (!loadError && visibleOrderCount === 0) {
    return (
      <ConsumerEmptyState
        easyMode={easyMode}
        icon={<ClipboardList className="size-7 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} />}
        message={m.orders.empty}
        action={
          <Link
            href={menuHref}
            className={`${chayaPrimaryButtonClass} px-8 ${easyMode ? "min-h-[48px]" : "min-h-[44px]"}`}
            aria-label={m.cart.emptyCtaAria}
          >
            {m.cart.emptyCta}
          </Link>
        }
      />
    );
  }

  return (
    <section className="space-y-4" aria-label={m.orders.pageTitle}>
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

      {!loadError && visibleOrderCount > 0 ? (
        <>
          {activeOrders.length > 0 ? (
            <>
              <div
                className="rounded-2xl border border-chaya-border/70 bg-chaya-surface px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                role="status"
                aria-live="polite"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {m.orders.counterVisitTotal}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {m.orders.counterVisitTotalHint}
                    </p>
                  </div>
                  <p className="shrink-0 self-end text-xl font-extrabold tabular-nums whitespace-nowrap text-chaya-primary sm:self-auto dark:text-orange-400">
                    {formatConsumerMoney(visitTotal, locale)}
                  </p>
                </div>
              </div>
              <div>
                <h2 className="mb-2 text-xs font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  {m.orders.sectionActive}
                </h2>
                <ul className={orderCardListClass} aria-label={m.orders.sectionActive}>
                  {activeOrders.map((o) => (
                    <li key={o.id} className="list-none">
                      <GuestOrderHistoryCard
                        tenant={tenant}
                        order={o}
                        locale={locale}
                        totalLabel={m.orderDetail.total}
                        cardTitle={m.orderDetail.linesHeading}
                        linkAria={m.orders.orderLinkAria}
                        easyMode={easyMode}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {cancelledOrders.length > 0 ? (
            <div>
              <h2 className="mb-2 text-xs font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {m.orders.sectionPast}
              </h2>
              <ul className={orderCardListClass} aria-label={m.orders.sectionPast}>
                {cancelledOrders.map((o) => (
                  <li key={o.id} className="list-none">
                    <GuestOrderHistoryCard
                      tenant={tenant}
                      order={o}
                      locale={locale}
                      totalLabel={m.orderDetail.total}
                      cardTitle={m.orderDetail.linesHeading}
                      linkAria={m.orders.orderLinkAria}
                      easyMode={easyMode}
                      cancelledNotice={m.progress.cancelled}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
