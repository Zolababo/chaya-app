"use client";

import { useCallback, useEffect, useState } from "react";

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
  const configured = Boolean(vapidPublicKey?.trim());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (!cancelled) setEnabled(!!sub);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (!vapidPublicKey || busy) return false;
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return false;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as NonNullable<
          PushSubscriptionOptionsInit["applicationServerKey"]
        >,
      });
      const j = subscription.toJSON();
      if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) return false;
      const res = await saveMerchantPushSubscription(tenant, {
        endpoint: j.endpoint,
        p256dh: j.keys.p256dh,
        auth: j.keys.auth,
      });
      if (res.ok) {
        setEnabled(true);
        return true;
      }
      return false;
    } finally {
      setBusy(false);
    }
  }, [tenant, vapidPublicKey, busy]);

  const disable = useCallback(async () => {
    if (busy) return false;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (!sub?.endpoint) {
        setEnabled(false);
        return true;
      }
      const res = await removeMerchantPushSubscription(tenant, { endpoint: sub.endpoint });
      if (res.ok) {
        await sub.unsubscribe().catch(() => {});
        setEnabled(false);
        return true;
      }
      return false;
    } finally {
      setBusy(false);
    }
  }, [tenant, busy]);

  const toggle = useCallback(async () => {
    if (!configured || busy) return;
    if (enabled) await disable();
    else await enable();
  }, [configured, busy, enabled, disable, enable]);

  return { enabled, busy, configured, toggle };
}
