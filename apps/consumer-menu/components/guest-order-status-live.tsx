"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import { fetchGuestOrderStatusAction } from "@/lib/orders/fetch-guest-order-status-action";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { orderStatusLabelForLocale } from "@/lib/i18n/order-status-for-locale";
import { ORDER_STATUS_POLL_MS } from "@/lib/orders/status-poll";

type Props = {
  tenant: string;
  orderId: string;
  initialStatus: string;
};

export function GuestOrderStatusLive({ tenant, orderId, initialStatus }: Props) {
  const { locale, m } = useConsumerLocale();
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const pull = useCallback(async () => {
    let guestSessionId: string | null = null;
    try {
      guestSessionId = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    } catch {
      guestSessionId = null;
    }
    setPending(true);
    try {
      const res = await fetchGuestOrderStatusAction(tenant, orderId, guestSessionId);
      if (res.ok) setStatus(res.status);
    } finally {
      setPending(false);
    }
  }, [tenant, orderId]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => void pull(), ORDER_STATUS_POLL_MS);
    return () => window.clearInterval(id);
  }, [pull, reducedMotion]);

  /** 모바일 백그라운드 등으로 폴링이 멈춘 뒤 복귀할 때 상태를 바로 한 번 받아 옵니다. */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void pull();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pull]);

  const statusText = orderStatusLabelForLocale(status, locale);

  return (
    <div className="space-y-4">
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-3 inline-flex rounded-full bg-zinc-200 px-4 py-1 text-sm font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
      >
        <span className="sr-only">{m.orderLive.statusSr} </span>
        {statusText}
      </p>

      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
        <button
          type="button"
          disabled={pending}
          onClick={() => void pull()}
          aria-busy={pending}
          aria-label={pending ? m.orderLive.refreshAriaPending : m.orderLive.refreshAria}
          className="min-h-[44px] rounded-xl border border-chaya-border px-4 py-2 text-sm font-semibold text-chaya-primary disabled:opacity-60 dark:border-zinc-700"
        >
          {pending ? m.orderLive.refreshPending : m.orderLive.refresh}
        </button>
        <button
          type="button"
          onClick={() => router.refresh()}
          aria-label={m.orderLive.fullRefreshAria}
          className="min-h-[44px] px-2 text-sm font-medium text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          {m.orderLive.fullRefresh}
        </button>
      </div>

      <p className="text-center text-xs text-zinc-500" role="status" aria-live="polite">
        {reducedMotion
          ? m.orderLive.pollOff
          : m.orderLive.pollOn.replace("{seconds}", String(Math.round(ORDER_STATUS_POLL_MS / 1000)))}
      </p>
    </div>
  );
}
