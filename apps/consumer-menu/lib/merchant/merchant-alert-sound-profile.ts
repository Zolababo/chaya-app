/** 주문 알림 — 이 기기 localStorage (음성 안내 on/off) */
export const MERCHANT_ALERT_SOUND_PROFILES = [
  { id: "default", label: "켜기" },
  { id: "mute", label: "끄기" },
] as const;

export type MerchantAlertSoundProfile = (typeof MERCHANT_ALERT_SOUND_PROFILES)[number]["id"];

export function parseMerchantAlertSoundProfile(raw: unknown): MerchantAlertSoundProfile {
  if (raw === "mute") return "mute";
  if (raw === "default" || raw === "bell_soft" || raw === "bell_bright") return "default";
  return "default";
}

export function soundProfileEnablesAudio(profile: MerchantAlertSoundProfile): boolean {
  return profile !== "mute";
}
