"use client";

import { useEffect, useState } from "react";
import { Bell, Vibrate } from "lucide-react";

import {
  MerchantSettingsIconBox,
  MerchantSettingsRowDivider,
  MerchantSettingsToggle,
} from "@/components/merchant-settings-sheet-ui";
import {
  MERCHANT_ALERT_SOUND_PROFILES,
  type MerchantAlertSoundProfile,
} from "@/lib/merchant/merchant-alert-sound-profile";
import {
  readMerchantAlertPreferences,
  writeMerchantAlertPreferences,
  type MerchantAlertPreferences,
} from "@/lib/merchant/merchant-alert-preferences";
import {
  previewMerchantAlertSound,
  unlockMerchantAlertAudio,
} from "@/lib/merchant/merchant-new-order-alert";

type Props = {
  tenant: string;
};

export function MerchantSettingsAlertControls({ tenant }: Props) {
  const [soundProfile, setSoundProfile] = useState<MerchantAlertSoundProfile>("default");
  const [vibrationOn, setVibrationOn] = useState(true);

  useEffect(() => {
    const prefs = readMerchantAlertPreferences(tenant);
    setSoundProfile(prefs.soundProfile);
    setVibrationOn(prefs.vibration);
  }, [tenant]);

  const persist = (
    profile: MerchantAlertSoundProfile,
    vibration: boolean,
    reAlertIntervalSec?: MerchantAlertPreferences["reAlertIntervalSec"],
  ) => {
    const prefs = readMerchantAlertPreferences(tenant);
    writeMerchantAlertPreferences(tenant, {
      soundProfile: profile,
      sound: profile !== "mute",
      vibration,
      reAlertIntervalSec: reAlertIntervalSec ?? prefs.reAlertIntervalSec,
    });
  };

  const onSoundChange = (profile: MerchantAlertSoundProfile) => {
    if (profile !== "mute") unlockMerchantAlertAudio();
    setSoundProfile(profile);
    persist(profile, vibrationOn);
    previewMerchantAlertSound(profile);
  };

  const onVibrationToggle = () => {
    const next = !vibrationOn;
    setVibrationOn(next);
    persist(soundProfile, next);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2.5 px-4 py-3">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <MerchantSettingsIconBox icon={Bell} />
          <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">주문 알림음</span>
        </span>
        <select
          className="max-w-[7.5rem] rounded-lg border border-chaya-border bg-white py-1.5 pr-7 pl-2.5 text-xs font-semibold text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          value={soundProfile}
          aria-label="알림음 선택"
          onChange={(e) => onSoundChange(e.target.value as MerchantAlertSoundProfile)}
        >
          {MERCHANT_ALERT_SOUND_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <MerchantSettingsRowDivider />
      <div className="flex items-center justify-between gap-2.5 px-4 py-3">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <MerchantSettingsIconBox icon={Vibrate} />
          <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">진동 알림</span>
        </span>
        <MerchantSettingsToggle on={vibrationOn} onToggle={onVibrationToggle} ariaLabel="진동 알림" />
      </div>
    </>
  );
}
