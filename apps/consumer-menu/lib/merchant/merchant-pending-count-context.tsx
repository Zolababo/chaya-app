"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  pendingCount: number | null;
  setPendingCount: (n: number | null) => void;
};

const MerchantPendingCountContext = createContext<Ctx | null>(null);

export function MerchantPendingCountProvider({
  initialCount,
  children,
}: {
  initialCount: number | null;
  children: ReactNode;
}) {
  const [pendingCount, setPendingCount] = useState<number | null>(initialCount);
  const value = useMemo(() => ({ pendingCount, setPendingCount }), [pendingCount]);
  return (
    <MerchantPendingCountContext.Provider value={value}>{children}</MerchantPendingCountContext.Provider>
  );
}

export function useMerchantPendingCount(): Ctx {
  const ctx = useContext(MerchantPendingCountContext);
  if (!ctx) {
    return {
      pendingCount: null,
      setPendingCount: () => {},
    };
  }
  return ctx;
}

/** layout 폴링 → 알림 리스너 */
export const MERCHANT_PENDING_UPDATE_EVENT = "chaya-merchant-pending-update";

export function dispatchMerchantPendingUpdate(pending: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MERCHANT_PENDING_UPDATE_EVENT, { detail: { pending } }),
  );
}
