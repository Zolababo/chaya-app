import { readMerchantAlertPreferences } from "@/lib/merchant/merchant-alert-preferences";
import type { MerchantAlertSoundProfile } from "@/lib/merchant/merchant-alert-sound-profile";

/** 점주 화면 — 새 대기 주문 감지 시 음성·진동·알림 */

let alertAudioCtx: AudioContext | null = null;

function getAlertAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  alertAudioCtx = alertAudioCtx ?? new Ctx();
  return alertAudioCtx;
}

/** iOS 등 — 사용자 탭 직후 오디오·음성 합성 준비 */
export function unlockMerchantAlertAudio(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAlertAudioContext();
    if (ctx?.state === "suspended") void ctx.resume();
  } catch {
    /* ignore */
  }
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.getVoices();
    } catch {
      /* ignore */
    }
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

/** Web Audio — 짧은 고음 3연타 (에셋 없이, lazy) */
function playKitchenAlarm(): void {
  const ctx = getAlertAudioContext();
  if (!ctx) return;
  void ctx.resume().then(() => {
    const now = ctx.currentTime;
    const freqs = [880, 1100, 880];
    for (let i = 0; i < freqs.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freqs[i]!;
      const t0 = now + i * 0.22;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.55, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    }
  });
}

function playAlertSound(profile: MerchantAlertSoundProfile, message: string): void {
  if (profile === "mute") return;
  if (profile === "kitchen") {
    playKitchenAlarm();
    return;
  }
  speakOrderAlert(message);
}

function vibrateMerchantAlert(): void {
  if (
    typeof navigator === "undefined" ||
    !navigator.vibrate ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  navigator.vibrate([300, 100, 300, 100, 400]);
}

function showMerchantOrderNotification(body: string, tag: string): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification("CHAYA", {
      body,
      tag,
      requireInteraction: true,
    } as NotificationOptions);
  } catch {
    /* ignore */
  }
}

type AlertPrefs = ReturnType<typeof readMerchantAlertPreferences>;

function resolvePrefs(tenantSlug?: string): AlertPrefs {
  if (tenantSlug != null && tenantSlug.trim()) {
    return readMerchantAlertPreferences(tenantSlug);
  }
  return { sound: true, vibration: true, soundProfile: "default", reAlertIntervalSec: 45 };
}

function fireMerchantAlert(
  message: string,
  prefs: AlertPrefs,
  options: { notificationTag: string; isReAlert?: boolean },
): void {
  if (prefs.vibration) vibrateMerchantAlert();
  if (prefs.sound && prefs.soundProfile !== "mute") {
    playAlertSound(prefs.soundProfile, message);
  }
  const tag = options.isReAlert ? `${options.notificationTag}-realert` : options.notificationTag;
  showMerchantOrderNotification(message, tag);
}

/** 설정 화면에서 미리듣기 */
export function previewMerchantAlertSound(profile: MerchantAlertSoundProfile): void {
  if (profile === "mute") return;
  unlockMerchantAlertAudio();
  if (profile === "kitchen") {
    playKitchenAlarm();
    return;
  }
  speakOrderAlert("주문 들어왔어요");
}

export function alertMerchantNewOrder(delta: number, tenantSlug?: string): void {
  if (typeof window === "undefined" || delta <= 0) return;
  const prefs = resolvePrefs(tenantSlug);
  const message = delta === 1 ? "주문 들어왔어요" : `주문 ${delta}건 들어왔어요`;
  fireMerchantAlert(message, prefs, { notificationTag: "chaya-merchant-new-order" });
}

/** 대기 주문이 남아 있을 때 주기 재알림 */
export function alertMerchantPendingReAlert(pendingCount: number, tenantSlug?: string): void {
  if (typeof window === "undefined" || pendingCount <= 0) return;
  const prefs = resolvePrefs(tenantSlug);
  const message =
    pendingCount === 1
      ? "대기 주문 1건 — 확인해 주세요"
      : `대기 주문 ${pendingCount}건 — 확인해 주세요`;
  fireMerchantAlert(message, prefs, {
    notificationTag: "chaya-merchant-pending",
    isReAlert: true,
  });
}

export function merchantPendingStorageKey(tenantSlug: string): string {
  return `chaya_merchant_pending_last:${tenantSlug}`;
}
