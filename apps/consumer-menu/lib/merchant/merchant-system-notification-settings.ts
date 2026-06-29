/** 휴대폰·OS 알림 설정 안내 (웹/PWA — Capacitor 네이티브와 분리) */

export type MerchantNotificationDeviceKind =
  | "android_pwa"
  | "android_browser"
  | "ios_pwa"
  | "ios_browser"
  | "desktop"
  | "unknown";

export function detectMerchantNotificationDeviceKind(): MerchantNotificationDeviceKind {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (/Android/i.test(ua)) return standalone ? "android_pwa" : "android_browser";
  if (/iPhone|iPad|iPod/i.test(ua)) return standalone ? "ios_pwa" : "ios_browser";
  if (/Windows|Macintosh|Linux/i.test(ua)) return "desktop";
  return "unknown";
}

export function merchantNotificationDeviceKindLabel(kind: MerchantNotificationDeviceKind): string {
  switch (kind) {
    case "android_pwa":
      return "Android · 홈 화면 앱";
    case "android_browser":
      return "Android · Chrome 탭";
    case "ios_pwa":
      return "iPhone · 홈 화면 앱";
    case "ios_browser":
      return "iPhone · Safari 탭";
    case "desktop":
      return "PC 브라우저";
    default:
      return "기타 기기";
  }
}

export function merchantNotificationPermissionLabel(): string {
  if (typeof Notification === "undefined") return "지원하지 않음";
  switch (Notification.permission) {
    case "granted":
      return "허용됨";
    case "denied":
      return "차단됨";
    default:
      return "아직 허용 안 함";
  }
}

export type OpenDeviceSettingsResult = "attempted" | "manual_only";

/**
 * Android에서 설정 앱 열기 시도. 웹/PWA는 앱별 알림 화면까지 보장되지 않습니다.
 * iOS·PC는 OS 정책상 웹에서 알림 설정 딥링크 불가 → manual_only.
 */
export function tryOpenDeviceNotificationSettings(): OpenDeviceSettingsResult {
  if (typeof window === "undefined") return "manual_only";
  const kind = detectMerchantNotificationDeviceKind();
  if (kind !== "android_pwa" && kind !== "android_browser") return "manual_only";

  const intents = [
    "intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;end",
    "intent:#Intent;action=android.settings.SETTINGS;end",
  ];

  for (const href of intents) {
    try {
      window.location.assign(href);
      return "attempted";
    } catch {
      /* try next */
    }
  }
  return "manual_only";
}

export type TestSystemNotificationResult =
  | "ok"
  | "no_permission"
  | "no_service_worker"
  | "failed";

/** 실제 푸시와 같은 Service Worker 채널로 테스트 알림 (소리·진동 확인용) */
export async function showMerchantTestSystemNotification(): Promise<TestSystemNotificationResult> {
  if (typeof window === "undefined") return "failed";
  if (!("Notification" in window)) return "no_permission";
  if (Notification.permission !== "granted") return "no_permission";
  if (!("serviceWorker" in navigator)) return "no_service_worker";

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification("[CHAYA] 테스트", {
      body: "이 소리·진동이 들리면 푸시 알림 설정이 맞습니다.",
      icon: "/icons/chaya-store-icon.png",
      badge: "/icons/chaya-store-icon.png",
      silent: false,
      tag: "chaya-push-test",
      ...({ vibrate: [400, 150, 400, 150, 600], renotify: true } as NotificationOptions),
    });
    return "ok";
  } catch {
    return "failed";
  }
}

export function merchantSystemNotificationManualSteps(kind: MerchantNotificationDeviceKind): string[] {
  switch (kind) {
    case "android_pwa":
      return [
        "설정 → 앱 → CHAYA(홈 화면 앱 이름) → 알림",
        "알림 허용 · 「조용히 표시」 끄기 · 소리 켜기 · 중요도 높음",
        "볼륨 키 → 「알림」 볼륨(미디어 아님) 올리기",
      ];
    case "android_browser":
      return [
        "설정 → 앱 → Chrome → 알림 → 허용",
        "「사이트」 알림 → 소리 켜기 · 조용히 표시 끄기",
        "주방용은 「홈 화면에 추가」 후 PWA 알림 채널도 따로 켜 주세요",
      ];
    case "ios_pwa":
      return [
        "설정 → 알림 → CHAYA(홈 화면 앱) → 알림 허용 · 소리",
        "집중 모드·방해 금지에서 CHAYA 예외",
      ];
    case "ios_browser":
      return [
        "Safari 탭만으로는 백그라운드 푸시가 제한됩니다",
        "공유 → 「홈 화면에 추가」 후 PWA에서 브라우저 푸시를 켜 주세요",
      ];
    case "desktop":
      return [
        "브라우저 주소창 왼쪽 자물쇠 → chaya-app 알림 허용",
        "Windows/macOS 시스템 알림·방해 금지 설정 확인",
      ];
    default:
      return ["설정 앱에서 CHAYA 또는 Chrome 알림 · 소리를 켜 주세요"];
  }
}
