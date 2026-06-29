"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Clock, ExternalLink, Smartphone, Volume2, Vibrate } from "lucide-react";

import { MerchantSettingsToggle } from "@/components/merchant-settings-sheet-ui";
import {
  merchantSubCardClass,
  merchantSubCardHeadClass,
  merchantSubCardTitleClass,
} from "@/lib/merchant/merchant-more-sub-styles";
import {
  readMerchantAlertPreferences,
  writeMerchantAlertPreferences,
  type MerchantAlertPreferences,
} from "@/lib/merchant/merchant-alert-preferences";
import {
  DEFAULT_MERCHANT_RE_ALERT_INTERVAL_SEC,
  MERCHANT_ALERT_SOUND_PROFILES,
  MERCHANT_RE_ALERT_INTERVALS,
  soundProfileEnablesAudio,
  type MerchantAlertSoundProfile,
  type MerchantReAlertIntervalSec,
} from "@/lib/merchant/merchant-alert-sound-profile";
import { previewMerchantAlertSound, unlockMerchantAlertAudio } from "@/lib/merchant/merchant-new-order-alert";
import {
  detectMerchantNotificationDeviceKind,
  merchantNotificationDeviceKindLabel,
  merchantNotificationPermissionLabel,
  merchantSystemNotificationManualSteps,
  showMerchantTestSystemNotification,
  tryOpenDeviceNotificationSettings,
} from "@/lib/merchant/merchant-system-notification-settings";
import { merchantSecondaryBtnClass } from "@/lib/merchant/merchant-more-sub-styles";
import { useMerchantWebPush } from "@/lib/merchant/use-merchant-web-push";

type Props = {
  tenant: string;
  vapidPublicKey: string | null;
  showWebPush: boolean;
  canEditPush: boolean;
};

const DEFAULT_PREFS: MerchantAlertPreferences = {
  sound: true,
  vibration: true,
  soundProfile: "default",
  reAlertIntervalSec: DEFAULT_MERCHANT_RE_ALERT_INTERVAL_SEC,
};

export function MerchantAlertSettingsPanel({
  tenant,
  vapidPublicKey,
  showWebPush,
  canEditPush,
}: Props) {
  const [prefs, setPrefs] = useState<MerchantAlertPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    setPrefs(readMerchantAlertPreferences(tenant));
  }, [tenant]);

  const update = (patch: Partial<MerchantAlertPreferences>) => {
    const next = { ...prefs, ...patch };
    const normalized: MerchantAlertPreferences = {
      ...next,
      sound: soundProfileEnablesAudio(next.soundProfile),
    };
    setPrefs(normalized);
    writeMerchantAlertPreferences(tenant, normalized);
  };

  const push = useMerchantWebPush({ tenant, vapidPublicKey });
  const [systemMsg, setSystemMsg] = useState<string | null>(null);
  const [systemBusy, setSystemBusy] = useState(false);
  const [permLabel, setPermLabel] = useState("확인 중…");

  const deviceKind = useMemo(
    () => (typeof window === "undefined" ? "unknown" : detectMerchantNotificationDeviceKind()),
    [],
  );
  const manualSteps = useMemo(() => merchantSystemNotificationManualSteps(deviceKind), [deviceKind]);

  useEffect(() => {
    setPermLabel(merchantNotificationPermissionLabel());
  }, [push.enabled]);

  const onTestSystemNotification = useCallback(async () => {
    setSystemBusy(true);
    setSystemMsg(null);
    try {
      if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
        const ok = await push.enable();
        setPermLabel(merchantNotificationPermissionLabel());
        if (!ok) {
          setSystemMsg("먼저 「브라우저 푸시」를 켜고 알림을 허용해 주세요.");
          return;
        }
      }
      const result = await showMerchantTestSystemNotification();
      if (result === "ok") {
        setSystemMsg("테스트 알림을 보냈습니다. 소리·진동이 들렸는지 확인해 주세요.");
        return;
      }
      if (result === "no_permission") {
        setSystemMsg("알림 권한이 없습니다. 「브라우저 푸시」를 켠 뒤 허용해 주세요.");
        return;
      }
      setSystemMsg("테스트 알림을 보내지 못했습니다. 앱을 한 번 종료했다가 다시 시도해 주세요.");
    } finally {
      setSystemBusy(false);
    }
  }, [push]);

  const onOpenDeviceSettings = useCallback(() => {
    setSystemMsg(null);
    const result = tryOpenDeviceNotificationSettings();
    if (result === "attempted") {
      setSystemMsg(
        "휴대폰 설정 앱을 열었습니다. CHAYA(또는 Chrome) → 알림 → 소리를 켜 주세요. 열리지 않으면 아래 안내를 따라 주세요.",
      );
      return;
    }
    setSystemMsg("이 기기에서는 설정 앱을 바로 열 수 없습니다. 아래 안내를 따라 주세요.");
  }, []);

  const onSoundProfileChange = (profile: MerchantAlertSoundProfile) => {
    if (profile !== "mute") {
      unlockMerchantAlertAudio();
      previewMerchantAlertSound(profile);
    }
    update({ soundProfile: profile, sound: profile !== "mute" });
  };

  return (
    <section className={merchantSubCardClass} aria-label="주문 알림">
      <div className={merchantSubCardHeadClass}>
        <h2 className={merchantSubCardTitleClass}>이 기기 알림 설정</h2>
        <p className="mt-0.5 text-xs font-medium text-[#9CA3AF]">
          앱이 열려 있을 때 소리·진동·재알림. 화면이 꺼지면 주방 알림음 대신 「브라우저 푸시」로
          시스템 알림·진동이 옵니다(미처리 주문은 약 45초마다).
        </p>
      </div>

      <div className="border-b border-[#F3F4F6] px-4 py-3 dark:border-zinc-800">
        <p className="rounded-xl border border-amber-200/90 bg-amber-50 px-3 py-2.5 text-xs font-medium leading-relaxed text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="font-bold">현장 백업:</span> 주문이 화면에 안 뜨거나 소리가 안 들리면, 손님에게
          카운터에서 직접 불러 달라고 안내해 주세요. 처음엔 시스템만 믿지 않는 것이 안전합니다.
        </p>
      </div>

      <div className="divide-y divide-[#F3F4F6] dark:divide-zinc-800">
        <div className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-2">
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#FFFBEB] text-[#D97706]">
              <Volume2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-[#111827] dark:text-zinc-50">알림음</span>
              <span className="block text-xs font-medium text-[#9CA3AF]">음성 안내 또는 주방 알람</span>
            </span>
          </span>
          <select
            className="max-w-[8.5rem] rounded-lg border border-[#E5E7EB] bg-white py-1.5 pr-7 pl-2.5 text-xs font-semibold text-[#111827] outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={prefs.soundProfile}
            aria-label="알림음 종류"
            onChange={(e) => onSoundProfileChange(e.target.value as MerchantAlertSoundProfile)}
          >
            {MERCHANT_ALERT_SOUND_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-h-[52px] items-center justify-between gap-3 px-4">
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#FFFBEB] text-[#D97706]">
              <Vibrate className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-[#111827] dark:text-zinc-50">진동</span>
              <span className="block text-xs font-medium text-[#9CA3AF]">지원 기기(모바일)에서만</span>
            </span>
          </span>
          <MerchantSettingsToggle
            on={prefs.vibration}
            onToggle={() => update({ vibration: !prefs.vibration })}
            ariaLabel="진동"
          />
        </div>

        <div className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-2">
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#FEF2F2] text-[#DC2626]">
              <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-[#111827] dark:text-zinc-50">미처리 재알림</span>
              <span className="block text-xs font-medium text-[#9CA3AF]">대기 주문이 남아 있으면 반복</span>
            </span>
          </span>
          <select
            className="max-w-[8.5rem] rounded-lg border border-[#E5E7EB] bg-white py-1.5 pr-7 pl-2.5 text-xs font-semibold text-[#111827] outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={prefs.reAlertIntervalSec}
            aria-label="재알림 간격"
            onChange={(e) =>
              update({ reAlertIntervalSec: Number(e.target.value) as MerchantReAlertIntervalSec })
            }
          >
            {MERCHANT_RE_ALERT_INTERVALS.map((opt) => (
              <option key={opt.sec} value={opt.sec}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {showWebPush ? (
          <div className="px-4 py-2">
            <div className="flex min-h-[52px] items-center justify-between gap-3">
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#EFF6FF] text-[#2563EB]">
                  <Bell className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold text-[#111827] dark:text-zinc-50">
                    브라우저 푸시
                  </span>
                  <span className="block text-xs font-medium text-[#9CA3AF]">
                    {push.configured ? "앱 닫아도 알림 받기 (주방용 권장)" : "준비 중"}
                  </span>
                </span>
              </span>
              {canEditPush && push.configured ? (
                <MerchantSettingsToggle
                  on={push.enabled}
                  onToggle={() => void push.toggle()}
                  disabled={push.busy}
                  ariaLabel="브라우저 푸시"
                />
              ) : (
                <span className="text-xs font-medium text-[#9CA3AF]">
                  {canEditPush ? "준비 중" : "권한 없음"}
                </span>
              )}
            </div>
            {push.error ? (
              <p className="mt-1 pb-2 text-xs font-semibold leading-relaxed text-red-600 dark:text-red-400">
                {push.error}
              </p>
            ) : null}
          </div>
        ) : null}

        {showWebPush ? (
          <div className="border-t border-[#F3F4F6] px-4 py-3 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#F0FDF4] text-[#16A34A]">
                <Smartphone className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-[#111827] dark:text-zinc-50">푸시 알림음 (휴대폰)</p>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-[#9CA3AF]">
                  앱을 닫았을 때 울리는 소리는 휴대폰·Chrome 설정입니다. 웹앱은 카카오톡처럼 전용
                  알림음 파일을 넣을 수 없고, 아래에서 소리·진동을 확인·설정해 주세요.
                </p>
                <p className="mt-1.5 text-[11px] font-semibold text-[#6B7280] dark:text-zinc-400">
                  {merchantNotificationDeviceKindLabel(deviceKind)} · 브라우저 알림: {permLabel}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={systemBusy || push.busy}
                onClick={() => void onTestSystemNotification()}
                className={`${merchantSecondaryBtnClass} min-h-[44px] px-3`}
              >
                {systemBusy ? "보내는 중…" : "테스트 알림 보내기"}
              </button>
              <button
                type="button"
                onClick={onOpenDeviceSettings}
                className={`${merchantSecondaryBtnClass} min-h-[44px] gap-1.5 px-3`}
              >
                <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                휴대폰 알림 설정 열기
              </button>
            </div>

            {systemMsg ? (
              <p className="mt-2 text-xs font-semibold leading-relaxed text-[#2563EB] dark:text-blue-300">
                {systemMsg}
              </p>
            ) : null}

            <ol className="mt-3 list-decimal space-y-1.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 pl-8 text-xs font-medium leading-relaxed text-[#4B5563] dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
              {manualSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
