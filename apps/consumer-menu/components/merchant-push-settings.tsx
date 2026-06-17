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
      return "알림 설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    case "push_role_forbidden":
      return "이 계정은 브라우저 알림을 켤 수 없습니다.";
    case "unsupported":
      return "이 브라우저에서는 웹 푸시를 지원하지 않습니다.";
    case "no_key":
      return "브라우저 알림을 아직 사용할 수 없습니다.";
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
      <p className="text-xs font-medium text-[#9CA3AF]">
        브라우저 푸시를 아직 사용할 수 없습니다. 주문은 대시보드·주문 탭에서 확인해 주세요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium leading-relaxed text-[#4B5563] dark:text-zinc-400">
        허용하면 앱을 닫아도 이 기기로 주문 알림을 받을 수 있습니다.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSubscribe()}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-chaya-primary px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "처리 중…" : "이 기기에서 알림 켜기"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onUnsubscribe()}
          className="min-h-[44px] rounded-xl border-[1.5px] border-[#E5E7EB] px-4 text-sm font-bold text-[#4B5563] disabled:opacity-50 dark:border-zinc-700"
        >
          알림 끄기
        </button>
      </div>
      {message ? (
        <p className="text-xs font-semibold text-[#00A85A]" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
