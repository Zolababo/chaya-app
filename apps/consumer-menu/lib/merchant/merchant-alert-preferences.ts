"use client";

import {
  parseMerchantAlertSoundProfile,
  soundProfileEnablesAudio,
  type MerchantAlertSoundProfile,
} from "@/lib/merchant/merchant-alert-sound-profile";

const KEY_PREFIX = "chaya_merchant_alert_prefs:";

export type MerchantAlertPreferences = {
  sound: boolean;
  vibration: boolean;
  soundProfile: MerchantAlertSoundProfile;
};

const DEFAULT_PREFS: MerchantAlertPreferences = {
  sound: true,
  vibration: true,
  soundProfile: "default",
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
