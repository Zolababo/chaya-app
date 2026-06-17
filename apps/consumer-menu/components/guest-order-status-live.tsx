"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import { fetchGuestOrderStatusAction } from "@/lib/orders/fetch-guest-order-status-action";
import { ORDER_STATUS_POLL_MS } from "@/lib/orders/status-poll";

type Props = {
  tenant: string;
  orderId: string;
  initialStatus: string;
};

/** 주문 상세 — 상태 문구·새로고침 버튼 없이 백그라운드 폴링만 (변경 시 RSC 갱신) */
export function GuestOrderStatusLive({ tenant, orderId, initialStatus }: Props) {
  const router = useRouter();
  const statusRef = useRef(initialStatus);

  useEffect(() => {
    statusRef.current = initialStatus;
  }, [initialStatus]);

  const pull = useCallback(async () => {
    let guestSessionId: string | null = null;
    try {
      guestSessionId = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    } catch {
      guestSessionId = null;
    }
    const res = await fetchGuestOrderStatusAction(tenant, orderId, guestSessionId);
    if (res.ok && res.status !== statusRef.current) {
      statusRef.current = res.status;
      router.refresh();
    }
  }, [tenant, orderId, router]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const id = window.setInterval(() => void pull(), ORDER_STATUS_POLL_MS);
    return () => window.clearInterval(id);
  }, [pull]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void pull();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pull]);

  return null;
}
