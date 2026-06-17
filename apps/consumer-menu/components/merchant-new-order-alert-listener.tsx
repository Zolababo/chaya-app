"use client";

import { useEffect, useRef } from "react";

import { useMerchantPendingCount } from "@/lib/merchant/merchant-pending-count-context";
import {
  alertMerchantNewOrder,
  unlockMerchantAlertAudio,
} from "@/lib/merchant/merchant-new-order-alert";

type Props = {
  tenant: string;
};

/** 매장 레이아웃 — 대기 주문 증가 시 소리·진동·알림 */
export function MerchantNewOrderAlertListener({ tenant }: Props) {
  const { pendingCount } = useMerchantPendingCount();
  const baselineRef = useRef<number | null>(null);
  const tenantRef = useRef(tenant);

  useEffect(() => {
    if (tenantRef.current !== tenant) {
      tenantRef.current = tenant;
      baselineRef.current = null;
    }
  }, [tenant]);

  useEffect(() => {
    const unlock = () => unlockMerchantAlertAudio();
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (pendingCount == null) return;

    if (baselineRef.current === null) {
      baselineRef.current = pendingCount;
      return;
    }

    if (pendingCount > baselineRef.current) {
      alertMerchantNewOrder(pendingCount - baselineRef.current, tenant);
    }

    baselineRef.current = pendingCount;
  }, [pendingCount]);

  return null;
}
