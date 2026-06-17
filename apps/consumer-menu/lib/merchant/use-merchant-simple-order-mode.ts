"use client";

import { useCallback, useEffect, useState } from "react";

function storageKey(tenant: string): string {
  return `chaya_merchant_simple_orders:${tenant.trim()}`;
}

/** 점주 기기 localStorage — 주문 버튼 문구 간소화. */
export function useMerchantSimpleOrderMode(tenant: string) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(tenant));
      setEnabled(raw === "1");
    } catch {
      setEnabled(false);
    }
    setReady(true);
  }, [tenant]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey(tenant), next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, [tenant]);

  return { enabled: ready ? enabled : false, ready, toggle };
}
