"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { invalidateMerchantCacheForTenant } from "@/lib/merchant/merchant-client-cache";
import { useMerchantPendingCount } from "@/lib/merchant/merchant-pending-count-context";
import { ORDER_STATUS_POLL_MS } from "@/lib/orders/status-poll";

type Props = {
  tenant: string;
};

/**
 * 점주앱 — 가벼운 summary JSON 폴링 (뱃지용).
 * 캐시 무효화는 **pending 건수가 바뀔 때만** — 22초마다 전체 재조회하지 않음.
 */
export function MerchantLiveSync({ tenant }: Props) {
  const pathname = usePathname() ?? "";
  const { setPendingCount } = useMerchantPendingCount();
  const prevPendingRef = useRef<number | null>(null);

  useEffect(() => {
    const tEnc = encodeURIComponent(tenant);
    const url = `/m/${tEnc}/live/summary`;

    const poll = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
        if (!res.ok) return;
        const data = (await res.json()) as { pending?: number };
        const pending = typeof data.pending === "number" ? data.pending : 0;

        setPendingCount(pending);

        const pendingChanged =
          prevPendingRef.current != null && pending !== prevPendingRef.current;

        if (pendingChanged) {
          const onOrders = pathname.includes("/orders");
          const onDashboard = pathname.includes("/dashboard");
          if (onOrders) invalidateMerchantCacheForTenant(tenant, "orders");
          if (onDashboard) invalidateMerchantCacheForTenant(tenant, "dashboard");
        }

        prevPendingRef.current = pending;
      } catch {
        /* ignore transient network errors */
      }
    };

    void poll();
    const id = window.setInterval(poll, ORDER_STATUS_POLL_MS);
    return () => window.clearInterval(id);
  }, [pathname, setPendingCount, tenant]);

  return null;
}
