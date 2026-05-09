"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ORDER_STATUS_POLL_MS } from "@/lib/orders/status-poll";

type Props = {
  /** 자동 새로고침 간격(ms). `prefers-reduced-motion: reduce` 이면 사용하지 않습니다. */
  intervalMs?: number;
};

export function OrderStatusRefresh({ intervalMs = ORDER_STATUS_POLL_MS }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(false);

  /** 점주 `/m/*` 는 httpOnly 쿠키 기준 인증인데, `router.refresh()` RSC 재요청에서 쿠키가 빠져 “접근 불가”로 바뀌는 브라우저·환경이 있음 → 전체 로드로 맞춤. */
  const reloadLatest = useCallback(() => {
    if (pathname?.startsWith("/m/")) {
      window.location.reload();
      return;
    }
    router.refresh();
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
