"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ensureWebNotificationPermission,
  merchantPushErrorMessageKo,
} from "@/lib/merchant/merchant-push-errors";
import {
  removeMerchantPushSubscription,
  saveMerchantPushSubscription,
} from "@/lib/merchant/merchant-push-subscription-actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Args = {
  tenant: string;
  vapidPublicKey: string | null;
};

export function useMerchantWebPush({ tenant, vapidPublicKey }: Args) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const configured = Boolean(vapidPublicKey?.trim());

  const refreshEnabled = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    setEnabled(!!sub);
  }, []);

  useEffect(() => {
    void refreshEnabled();
  }, [refreshEnabled]);

  const enable = useCallback(async () => {
    if (!vapidPublicKey?.trim()) {
      setError(merchantPushErrorMessageKo("push_not_configured"));
      return false;
    }
    if (busyRef.current) return false;

    busyRef.current = true;
    setBusy(true);
    setError(null);

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setError(merchantPushErrorMessageKo("push_not_supported"));
        return false;
      }

      // Android Chrome: 버튼 탭 직후(제스처 유효 시점)에 권한 요청 — SW 등록 전에 해야 함
      const permResult = await ensureWebNotificationPermission();
      if (permResult === "denied") {
        setError(merchantPushErrorMessageKo("push_permission_denied"));
        return false;
      }
      if (permResult !== "granted") {
        setError(merchantPushErrorMessageKo("push_permission_dismissed"));
        return false;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe().catch(() => {});
      }

      let subscription: PushSubscription;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as NonNullable<
            PushSubscriptionOptionsInit["applicationServerKey"]
          >,
        });
      } catch {
        setError(merchantPushErrorMessageKo("push_subscribe_failed"));
        return false;
      }

      const j = subscription.toJSON();
      if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) {
        setError(merchantPushErrorMessageKo("push_subscribe_failed"));
        return false;
      }

      const res = await saveMerchantPushSubscription(tenant, {
        endpoint: j.endpoint,
        p256dh: j.keys.p256dh,
        auth: j.keys.auth,
      });

      if (!res.ok) {
        setError(merchantPushErrorMessageKo(res.code));
        await subscription.unsubscribe().catch(() => {});
        return false;
      }

      setEnabled(true);
      return true;
    } catch {
      setError(merchantPushErrorMessageKo("push_subscribe_failed"));
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [tenant, vapidPublicKey]);

  const disable = useCallback(async () => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (!sub?.endpoint) {
        setEnabled(false);
        return true;
      }

      const res = await removeMerchantPushSubscription(tenant, { endpoint: sub.endpoint });
      if (!res.ok) {
        setError(merchantPushErrorMessageKo(res.code));
        return false;
      }

      await sub.unsubscribe().catch(() => {});
      setEnabled(false);
      return true;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [tenant]);

  const toggle = useCallback(async () => {
    if (!configured || busyRef.current) return;
    if (enabled) await disable();
    else await enable();
  }, [configured, enabled, disable, enable]);

  const clearError = useCallback(() => setError(null), []);

  return {
    enabled,
    busy,
    configured,
    error,
    clearError,
    toggle,
    enable,
    disable,
    refreshEnabled,
  };
}
