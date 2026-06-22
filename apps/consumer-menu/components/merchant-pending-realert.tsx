"use client";

import { useEffect, useRef } from "react";

import { readMerchantAlertPreferences } from "@/lib/merchant/merchant-alert-preferences";
import { alertMerchantPendingReAlert } from "@/lib/merchant/merchant-new-order-alert";
import { useMerchantPendingCount } from "@/lib/merchant/merchant-pending-count-context";

type Props = {
  tenant: string;
};

/**
 * 대기(pending) 주문이 처리되기 전까지 주기적으로 소리·진동·알림 재전송.
 * 기존 summary 폴링의 pendingCount만 사용 — 추가 API 없음.
 */
export function MerchantPendingReAlert({ tenant }: Props) {
  const { pendingCount } = useMerchantPendingCount();
  const armedAtRef = useRef<number>(0);
  const lastReAlertRef = useRef<number>(0);
  const prevPendingRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingCount != null && prevPendingRef.current != null && pendingCount > prevPendingRef.current) {
      lastReAlertRef.current = Date.now();
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount]);

  useEffect(() => {
    if (pendingCount == null || pendingCount <= 0) {
      armedAtRef.current = 0;
      lastReAlertRef.current = 0;
      return;
    }

    const now = Date.now();
    if (armedAtRef.current === 0) {
      armedAtRef.current = now;
      lastReAlertRef.current = now;
    }

    const prefs = readMerchantAlertPreferences(tenant);
    const intervalMs = prefs.reAlertIntervalSec * 1000;
    if (!intervalMs) return;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if ((pendingCount ?? 0) <= 0) return;

      const t = Date.now();
      if (t - lastReAlertRef.current < intervalMs) return;
      lastReAlertRef.current = t;
      alertMerchantPendingReAlert(pendingCount, tenant);
    };

    const id = window.setInterval(tick, 5_000);
    return () => window.clearInterval(id);
  }, [pendingCount, tenant]);

  return null;
}
