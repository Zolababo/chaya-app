"use client";

import { useEffect } from "react";

import { useMerchantPendingCount } from "@/lib/merchant/merchant-pending-count-context";

/** PWA 홈 화면 아이콘 배지 — 대기 주문 수 (지원 브라우저만) */
export function MerchantAppBadgeSync() {
  const { pendingCount } = useMerchantPendingCount();

  useEffect(() => {
    if (typeof navigator === "undefined" || !("setAppBadge" in navigator)) return;

    const nav = navigator as Navigator & {
      setAppBadge?: (count: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };

    if (pendingCount != null && pendingCount > 0) {
      void nav.setAppBadge?.(pendingCount > 99 ? 99 : pendingCount);
      return;
    }

    void nav.clearAppBadge?.();
  }, [pendingCount]);

  return null;
}
