"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  tenantSlug: string;
  pendingCount: number | null;
};

const HIDE_MS = 12_000;

export function MerchantPendingDeltaNotice({ tenantSlug, pendingCount }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const storageKey = useMemo(() => `chaya_merchant_pending_last:${tenantSlug}`, [tenantSlug]);

  useEffect(() => {
    if (pendingCount == null) return;

    let prev: number | null = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw != null) {
        const n = Number.parseInt(raw, 10);
        if (Number.isFinite(n) && n >= 0) prev = n;
      }
    } catch {
      prev = null;
    }

    if (prev != null && pendingCount > prev) {
      const delta = pendingCount - prev;
      setMessage(`주문이 들어왔습니다 · 대기 ${pendingCount}건 (+${delta})`);
    }
  }, [pendingCount, storageKey]);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), HIDE_MS);
    return () => window.clearTimeout(id);
  }, [message]);

  if (!message) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
    >
      {message}
    </p>
  );
}
