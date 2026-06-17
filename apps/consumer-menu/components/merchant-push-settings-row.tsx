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

type Props = {
  tenant: string;
  vapidPublicKey: string | null;
};

export function MerchantPushSettingsRow({ tenant, vapidPublicKey }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (!cancelled) setEnabled(!!sub);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onEnable = useCallback(async () => {
    if (!vapidPublicKey || busy) return;
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as NonNullable<
          PushSubscriptionOptionsInit["applicationServerKey"]
        >,
      });
      const j = subscription.toJSON();
      if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) return;
      const res = await saveMerchantPushSubscription(tenant, {
        endpoint: j.endpoint,
        p256dh: j.keys.p256dh,
        auth: j.keys.auth,
      });
      if (res.ok) setEnabled(true);
    } finally {
      setBusy(false);
    }
  }, [tenant, vapidPublicKey, busy]);

  const onDisable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (!sub?.endpoint) {
        setEnabled(false);
        return;
      }
      const res = await removeMerchantPushSubscription(tenant, { endpoint: sub.endpoint });
      if (res.ok) {
        await sub.unsubscribe().catch(() => {});
        setEnabled(false);
      }
    } finally {
      setBusy(false);
    }
  }, [tenant, busy]);

  if (!vapidPublicKey) {
    return (
      <button type="button" disabled className="rounded-lg bg-[#F2F3F5] px-4 py-2 text-[13px] font-extrabold text-[#9CA3AF]">
        준비 중
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void (enabled ? onDisable() : onEnable())}
      className={[
        "rounded-lg px-4 py-2 text-[13px] font-extrabold transition active:opacity-80 disabled:opacity-50",
        enabled
          ? "border-[1.5px] border-[#E5E7EB] bg-[#F2F3F5] text-[#9CA3AF] dark:border-zinc-700 dark:bg-zinc-900"
          : "bg-chaya-primary text-white",
      ].join(" ")}
    >
      {busy ? "…" : enabled ? "끄기" : "켜기"}
    </button>
  );
}
