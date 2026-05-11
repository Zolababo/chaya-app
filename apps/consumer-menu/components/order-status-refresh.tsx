"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ORDER_STATUS_POLL_MS } from "@/lib/orders/status-poll";

type Props = {
  /** 자동 새로고침 간격(ms). `prefers-reduced-motion: reduce` 이면 사용하지 않습니다. */
  intervalMs?: number;
};

export function OrderStatusRefresh({ intervalMs = ORDER_STATUS_POLL_MS }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(false);
  const isRefreshingRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  const reloadLatest = useCallback(() => {
    // visibilitychange + interval + 수동 버튼이 겹치면 중복 refresh가 발생할 수 있어 간단히 직렬화합니다.
    if (isRefreshingRef.current) return;
    const now = Date.now();
    if (now - lastRefreshAtRef.current < 1500) return;
    if (!pathname) return;

    isRefreshingRef.current = true;
    lastRefreshAtRef.current = now;
    try {
      router.refresh();
    } finally {
      window.setTimeout(() => {
        isRefreshingRef.current = false;
      }, 400);
    }
  }, [pathname, router]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      reloadLatest();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, reducedMotion, reloadLatest]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") reloadLatest();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [reloadLatest]);

  return (
    <div
      className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4"
      role="region"
      aria-label="목록 새로고침"
    >
      <button
        type="button"
        onClick={() => reloadLatest()}
        aria-label="서버에서 최신 목록으로 새로고침"
        className="min-h-[44px] rounded-xl border border-chaya-border px-4 py-2 text-sm font-semibold text-chaya-primary dark:border-zinc-700"
      >
        최신 상태로 새로고침
      </button>
      <p className="text-center text-xs text-zinc-500" role="status" aria-live="polite">
        {reducedMotion
          ? "자동 갱신은 꺼져 있습니다. 위 버튼으로 확인해 주세요."
          : `약 ${Math.round(intervalMs / 1000)}초마다 자동으로 갱신합니다.`}
      </p>
    </div>
  );
}
