"use client";

import { useCallback, useState } from "react";

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

function errMessage(code: string): string {
  switch (code) {
    case "push_bad_endpoint":
      return "구독 정보(주소)가 올바르지 않습니다.";
    case "push_bad_keys":
      return "암호화 키가 올바르지 않습니다.";
    case "push_no_session":
      return "세션이 없습니다. 다시 로그인해 주세요.";
    case "push_save_failed":
      return "서버에 구독을 저장하지 못했습니다. DB 마이그레이션 적용 여부를 확인해 주세요.";
    case "push_role_forbidden":
      return "조회 전용(viewer·finance) 계정은 브라우저 알림 구독을 사용할 수 없습니다.";
    case "unsupported":
      return "이 브라우저에서는 웹 푸시를 지원하지 않습니다.";
    case "no_key":
      return "서버에 VAPID 공개 키가 없습니다.";
    case "denied":
      return "알림 권한이 거부되었습니다. 브라우저 설정에서 허용할 수 있습니다.";
    default:
      return "처리 중 오류가 났습니다.";
  }
}

type Props = {
  tenant: string;
  vapidPublicKey: string | null;
};

export function MerchantPushSettings({ tenant, vapidPublicKey }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubscribe = useCallback(async () => {
    setMessage(null);
    if (!vapidPublicKey) {
      setMessage(errMessage("no_key"));
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage(errMessage("unsupported"));
      return;
    }
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMessage(errMessage("denied"));
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as NonNullable<
          PushSubscriptionOptionsInit["applicationServerKey"]
        >,
      });
      const j = subscription.toJSON();
      const endpoint = j.endpoint;
      const k = j.keys;
      if (!endpoint || !k?.p256dh || !k?.auth) {
        setMessage(errMessage("push_bad_keys"));
        return;
      }
      const res = await saveMerchantPushSubscription(tenant, {
        endpoint,
        p256dh: k.p256dh,
        auth: k.auth,
      });
      if (!res.ok) {
        setMessage(errMessage(res.code));
        return;
      }
      setMessage("이 기기에서 새 주문 알림을 받도록 설정했습니다.");
    } catch (e) {
      console.error("[MerchantPushSettings]", e);
      setMessage(errMessage("default"));
    } finally {
      setBusy(false);
    }
  }, [tenant, vapidPublicKey]);

  const onUnsubscribe = useCallback(async () => {
    setMessage(null);
    if (!("serviceWorker" in navigator)) {
      setMessage(errMessage("unsupported"));
      return;
    }
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (!sub) {
        setMessage("이 브라우저에는 저장된 푸시 구독이 없습니다.");
        return;
      }
      const j = sub.toJSON();
      const endpoint = j.endpoint;
      if (!endpoint) {
        setMessage(errMessage("push_bad_endpoint"));
        return;
      }
      const res = await removeMerchantPushSubscription(tenant, { endpoint });
      if (!res.ok) {
        setMessage(errMessage(res.code));
        return;
      }
      await sub.unsubscribe().catch(() => {});
      setMessage("이 기기에서 주문 푸시를 끄고 서버 구독을 지웠습니다.");
    } catch (e) {
      console.error("[MerchantPushSettings]", e);
      setMessage(errMessage("default"));
    } finally {
      setBusy(false);
    }
  }, [tenant]);

  if (!vapidPublicKey) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-400">
        웹 푸시를 쓰려면 호스트에{" "}
        <span className="font-mono">NEXT_PUBLIC_VAPID_PUBLIC_KEY</span>, <span className="font-mono">VAPID_PRIVATE_KEY</span>,{" "}
        <span className="font-mono">VAPID_SUBJECT</span> (예: mailto:you@domain) 를 설정하고 재배포하세요. DB에는{" "}
        <span className="font-mono">20260512220000_merchant_push_subscriptions.sql</span> 마이그레이션이 필요합니다.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/80">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">브라우저 새 주문 알림 (웹 푸시)</p>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        모바일·데스크톱에서 허용하면 백그라운드에서도 알림을 받을 수 있습니다. (iOS는 PWA 홈 화면에 추가한 뒤 동작하는 경우가 많습니다.)
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSubscribe()}
          className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-indigo-400 dark:text-indigo-950"
        >
          {busy ? "처리 중…" : "이 기기에서 알림 켜기"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onUnsubscribe()}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200"
        >
          알림 끄기 (이 기기)
        </button>
      </div>
      {message ? (
        <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
