"use client";

import {
  DEFAULT_MERCHANT_RE_ALERT_INTERVAL_SEC,
  parseMerchantAlertSoundProfile,
  parseMerchantReAlertIntervalSec,
  soundProfileEnablesAudio,
  type MerchantAlertSoundProfile,
  type MerchantReAlertIntervalSec,
} from "@/lib/merchant/merchant-alert-sound-profile";

const KEY_PREFIX = "chaya_merchant_alert_prefs:";

export type MerchantAlertPreferences = {
  sound: boolean;
  vibration: boolean;
  soundProfile: MerchantAlertSoundProfile;
  /** 대기 주문이 남아 있을 때 재알림 간격(초). 0 = 끄기 */
  reAlertIntervalSec: MerchantReAlertIntervalSec;
};

const DEFAULT_PREFS: MerchantAlertPreferences = {
  sound: true,
  vibration: true,
  soundProfile: "default",
  reAlertIntervalSec: DEFAULT_MERCHANT_RE_ALERT_INTERVAL_SEC,
};

function normalizePrefs(parsed: Partial<MerchantAlertPreferences>): MerchantAlertPreferences {
  let soundProfile = parseMerchantAlertSoundProfile(parsed.soundProfile);
  if (parsed.soundProfile == null && parsed.sound === false) {
    soundProfile = "mute";
  }
  const sound = soundProfileEnablesAudio(soundProfile);
  return {
    sound,
    vibration: parsed.vibration !== false,
    soundProfile,
    reAlertIntervalSec: parseMerchantReAlertIntervalSec(parsed.reAlertIntervalSec),
  };
}

export function merchantAlertPrefsStorageKey(tenant: string): string {
  return `${KEY_PREFIX}${tenant.trim()}`;
}

export function readMerchantAlertPreferences(tenant: string): MerchantAlertPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(merchantAlertPrefsStorageKey(tenant));
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<MerchantAlertPreferences>;
    return normalizePrefs(parsed);
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writeMerchantAlertPreferences(tenant: string, prefs: MerchantAlertPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(merchantAlertPrefsStorageKey(tenant), JSON.stringify(prefs));
}
