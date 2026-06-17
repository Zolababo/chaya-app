"use client";

import { useEffect, useState } from "react";
import { Bell, Volume2, Vibrate } from "lucide-react";

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
import { soundProfileEnablesAudio } from "@/lib/merchant/merchant-alert-sound-profile";
import { previewMerchantAlertSound, unlockMerchantAlertAudio } from "@/lib/merchant/merchant-new-order-alert";
import { useMerchantWebPush } from "@/lib/merchant/use-merchant-web-push";

type Props = {
  tenant: string;
  vapidPublicKey: string | null;
  showWebPush: boolean;
  canEditPush: boolean;
};

export function MerchantAlertSettingsPanel({
  tenant,
  vapidPublicKey,
  showWebPush,
  canEditPush,
}: Props) {
  const [prefs, setPrefs] = useState<MerchantAlertPreferences>({
    sound: true,
    vibration: true,
    soundProfile: "default",
  });

  useEffect(() => {
    setPrefs(readMerchantAlertPreferences(tenant));
  }, [tenant]);

  const update = (patch: Partial<MerchantAlertPreferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    writeMerchantAlertPreferences(tenant, next);
  };

  const soundOn = soundProfileEnablesAudio(prefs.soundProfile);
  const push = useMerchantWebPush({ tenant, vapidPublicKey });

  return (
    <section className={merchantSubCardClass} aria-label="주문 알림">
      <div className={merchantSubCardHeadClass}>
        <h2 className={merchantSubCardTitleClass}>이 기기 알림 설정</h2>
        <p className="mt-0.5 text-xs font-medium text-[#9CA3AF]">브라우저 탭이 열린 상태에서 동작해요</p>
      </div>

      <div className="divide-y divide-[#F3F4F6] dark:divide-zinc-800">
        <div className="flex min-h-[52px] items-center justify-between gap-3 px-4">
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#FFFBEB] text-[#D97706]">
              <Volume2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-[#111827] dark:text-zinc-50">알림음</span>
              <span className="block text-xs font-medium text-[#9CA3AF]">「주문 들어왔어요」 음성 안내</span>
            </span>
          </span>
          <MerchantSettingsToggle
            on={soundOn}
            onToggle={() => {
              const nextOn = !soundOn;
              if (nextOn) {
                unlockMerchantAlertAudio();
                previewMerchantAlertSound("default");
              }
              update({
                soundProfile: nextOn ? "default" : "mute",
                sound: nextOn,
              });
            }}
            ariaLabel="알림음"
          />
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

        {showWebPush ? (
          <div className="flex min-h-[52px] items-center justify-between gap-3 px-4">
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#EFF6FF] text-[#2563EB]">
                <Bell className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-[#111827] dark:text-zinc-50">
                  브라우저 푸시
                </span>
                <span className="block text-xs font-medium text-[#9CA3AF]">
                  {push.configured ? "앱 닫아도 알림 받기" : "준비 중"}
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
        ) : null}
      </div>
    </section>
  );
}
