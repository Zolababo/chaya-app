"use client";

import { BellRing } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useMerchantWebPush } from "@/lib/merchant/use-merchant-web-push";

type Props = {
  tenant: string;
  vapidPublicKey: string | null;
  canEnable: boolean;
};

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function dismissKey(tenant: string): string {
  return `chaya_merchant_push_banner_dismiss_v1:${encodeURIComponent(tenant.trim())}`;
}

/**
 * 화면 꺼짐·백그라운드 주문 알림(Web Push) — PWA 설치 후 반드시 켜야 하는 안내.
 * 포그라운드 소리만으로는 주방 태블릿에서 주문을 놓칩니다.
 */
export function MerchantBackgroundPushBanner({
  tenant,
  vapidPublicKey,
  canEnable,
}: Props) {
  const { enabled, busy, configured, enable, error } = useMerchantWebPush({
    tenant,
    vapidPublicKey,
  });
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!configured || !canEnable || enabled) {
      setHidden(true);
      return;
    }
    try {
      const dismissed = sessionStorage.getItem(dismissKey(tenant)) === "1";
      setHidden(dismissed && !isStandalonePwa());
    } catch {
      setHidden(false);
    }
  }, [configured, canEnable, enabled, tenant]);

  const onEnable = useCallback(async () => {
    const ok = await enable();
    if (ok) setHidden(true);
  }, [enable]);

  const onDismiss = useCallback(() => {
    if (isStandalonePwa()) return;
    try {
      sessionStorage.setItem(dismissKey(tenant), "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  }, [tenant]);

  if (!configured || !canEnable || enabled || hidden) return null;

  return (
    <div
      className="sticky top-0 z-[35] border-b border-amber-300 bg-amber-50 px-4 py-3 shadow-sm dark:border-amber-800 dark:bg-amber-950/90"
      role="region"
      aria-label="백그라운드 주문 알림"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
            <BellRing className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-950 dark:text-amber-50">
              화면이 꺼져 있어도 주문 알림 받기
            </p>
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-amber-900/90 dark:text-amber-100/90">
              앱을 켜 둔 상태에서만 울리는 소리만으로는 주문을 놓칠 수 있습니다. 아래 버튼으로
              브라우저 푸시를 켜 주세요.
            </p>
            {error ? (
              <p className="mt-2 text-xs font-semibold leading-relaxed text-red-700 dark:text-red-300">
                {error}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          {!isStandalonePwa() ? (
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200"
              onClick={onDismiss}
            >
              나중에
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.98] disabled:opacity-60"
            onClick={() => void onEnable()}
          >
            {busy ? "설정 중…" : "알림 켜기"}
          </button>
        </div>
      </div>
    </div>
  );
}
