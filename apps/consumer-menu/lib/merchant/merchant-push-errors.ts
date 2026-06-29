/** 점주 Web Push 활성화 오류 — UI 메시지 */

export function merchantPushErrorMessageKo(code: string): string {
  switch (code) {
    case "push_permission_denied":
      return [
        "브라우저가 이 사이트 알림을 차단했습니다.",
        "갤럭시 앱 알림이 켜져 있어도, Chrome 사이트 권한이 따로 필요합니다.",
        "Chrome에서 chaya-app.vercel.app 을 연 뒤",
        "주소창 왼쪽 아이콘(자물쇠) → 권한 → 알림 허용.",
        "PWA(홈 화면 앱)면 앱 정보 → 알림·권한에서 사이트 알림도 확인해 주세요.",
      ].join(" ");
    case "push_permission_dismissed":
      return "알림 허용 창이 닫혔습니다. 「알림 켜기」를 다시 눌러 허용을 선택해 주세요.";
    case "push_not_supported":
      return "이 브라우저는 웹 푸시를 지원하지 않습니다. Chrome으로 홈 화면 앱을 열어 주세요.";
    case "push_subscribe_failed":
      return "푸시 구독에 실패했습니다. 앱을 완전히 종료한 뒤 다시 시도해 주세요.";
    case "push_save_failed":
      return "구독 저장에 실패했습니다. DB 마이그레이션(merchant_push_subscriptions) 적용 여부를 확인해 주세요.";
    case "push_no_session":
      return "로그인이 만료됐습니다. 다시 로그인한 뒤 시도해 주세요.";
    case "push_role_forbidden":
      return "이 계정 역할에서는 푸시를 켤 수 없습니다.";
    case "push_not_configured":
      return "서버 푸시 키(VAPID)가 설정되지 않았습니다.";
    default:
      return `푸시 설정 실패 (${code})`;
  }
}

async function requestWebNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export async function ensureWebNotificationPermission(): Promise<
  "granted" | "denied" | "dismissed"
> {
  const perm = await requestWebNotificationPermission();
  if (perm === "granted") return "granted";
  if (perm === "denied") return "denied";
  return "dismissed";
}
