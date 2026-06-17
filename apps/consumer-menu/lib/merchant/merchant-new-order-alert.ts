import { readMerchantAlertPreferences } from "@/lib/merchant/merchant-alert-preferences";
import type { MerchantAlertSoundProfile } from "@/lib/merchant/merchant-alert-sound-profile";

/** 점주 화면 — 새 대기 주문 감지 시 음성·진동·알림 */

/** iOS 등 — 사용자 탭 직후 음성 합성 준비 */
export function unlockMerchantAlertAudio(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.getVoices();
  } catch {
    /* ignore */
  }
}

function speakOrderAlert(text: string): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ko-KR";
  utter.rate = 0.92;
  utter.volume = 1;
  utter.pitch = 1.02;
  window.speechSynthesis.speak(utter);
}

/** 설정 화면에서 미리듣기 */
export function previewMerchantAlertSound(profile: MerchantAlertSoundProfile): void {
  if (profile === "mute") return;
  speakOrderAlert("주문 들어왔어요");
}

export function alertMerchantNewOrder(delta: number, tenantSlug?: string): void {
  if (typeof window === "undefined" || delta <= 0) return;

  const prefs =
    tenantSlug != null && tenantSlug.trim()
      ? readMerchantAlertPreferences(tenantSlug)
      : { sound: true, vibration: true, soundProfile: "default" as const };

  const message = delta === 1 ? "주문 들어왔어요" : `주문 ${delta}건 들어왔어요`;

  if (
    prefs.vibration &&
    typeof navigator !== "undefined" &&
    navigator.vibrate &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    navigator.vibrate([300, 100, 300, 100, 400]);
  }

  if (prefs.sound && prefs.soundProfile !== "mute") {
    speakOrderAlert(message);
  }

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("CHAYA", {
        body: message,
        tag: "chaya-merchant-new-order",
        requireInteraction: true,
      } as NotificationOptions);
    } catch {
      /* ignore */
    }
  }
}

export function merchantPendingStorageKey(tenantSlug: string): string {
  return `chaya_merchant_pending_last:${tenantSlug}`;
}
