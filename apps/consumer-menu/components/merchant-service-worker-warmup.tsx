"use client";

import { useEffect } from "react";

/** 점주앱 — Web Push용 service worker를 앱 진입 시 미리 등록 */
export function MerchantServiceWorkerWarmup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);

  return null;
}
