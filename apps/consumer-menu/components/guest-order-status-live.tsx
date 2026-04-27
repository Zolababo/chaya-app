"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { fetchGuestOrderStatusAction } from "@/lib/orders/fetch-guest-order-status-action";
import { orderStatusLabel } from "@/lib/orders/order-status-label";
import { ORDER_STATUS_POLL_MS } from "@/lib/orders/status-poll";

type Props = {
  tenant: string;
  orderId: string;
  initialStatus: string;
};

export function GuestOrderStatusLive({ tenant, orderId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const pull = useCallback(async () => {
    setPending(true);
    try {
      const res = await fetchGuestOrderStatusAction(tenant, orderId);
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

  return (
    <div className="space-y-4">
      <p className="mt-3 inline-flex rounded-full bg-zinc-200 px-4 py-1 text-sm font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
        {orderStatusLabel(status)}
      </p>

      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
        <button
          type="button"
          disabled={pending}
          onClick={() => void pull()}
          className="rounded-xl border border-chaya-border px-4 py-2 text-sm font-semibold text-chaya-primary disabled:opacity-60 dark:border-zinc-700"
        >
          {pending ? "불러오는 중…" : "최신 상태로"}
        </button>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="text-sm font-medium text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          품목·금액까지 전체 새로고침
        </button>
      </div>

      <p className="text-center text-xs text-zinc-500">
        {reducedMotion
          ? "자동 갱신은 꺼져 있습니다. 위 버튼으로 확인해 주세요."
          : `약 ${Math.round(ORDER_STATUS_POLL_MS / 1000)}초마다 상태만 자동으로 다시 불러옵니다.`}
      </p>
    </div>
  );
}
