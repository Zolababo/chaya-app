/** 주문 알림 — 이 기기 localStorage (음성·주방 알람·끄기) */
export const MERCHANT_ALERT_SOUND_PROFILES = [
  { id: "default", label: "음성 안내" },
  { id: "kitchen", label: "주방 알람" },
  { id: "mute", label: "끄기" },
] as const;

export type MerchantAlertSoundProfile = (typeof MERCHANT_ALERT_SOUND_PROFILES)[number]["id"];

/** 대기 주문 미처리 시 재알림 간격(초). 0 = 끄기 */
export const MERCHANT_RE_ALERT_INTERVALS = [
  { sec: 45, label: "45초" },
  { sec: 30, label: "30초" },
  { sec: 60, label: "1분" },
  { sec: 0, label: "끄기" },
] as const;

export type MerchantReAlertIntervalSec = (typeof MERCHANT_RE_ALERT_INTERVALS)[number]["sec"];

export const DEFAULT_MERCHANT_RE_ALERT_INTERVAL_SEC: MerchantReAlertIntervalSec = 45;

export function parseMerchantAlertSoundProfile(raw: unknown): MerchantAlertSoundProfile {
  if (raw === "mute") return "mute";
  if (raw === "kitchen") return "kitchen";
  if (raw === "default" || raw === "bell_soft" || raw === "bell_bright") return "default";
  return "default";
}

export function parseMerchantReAlertIntervalSec(raw: unknown): MerchantReAlertIntervalSec {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  if (n === 30 || n === 45 || n === 60 || n === 0) return n;
  return DEFAULT_MERCHANT_RE_ALERT_INTERVAL_SEC;
}

export function soundProfileEnablesAudio(profile: MerchantAlertSoundProfile): boolean {
  return profile !== "mute";
}
