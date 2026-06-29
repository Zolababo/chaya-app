import { isMerchantInternalUiVisible } from "@/lib/merchant/merchant-internal-ui";

/** 점주 화면용 — 기술·역할 코드를 숨긴 짧은 문구. */

export type MerchantLoadingContext =
  | "default"
  | "dashboard"
  | "orders"
  | "menus"
  | "analytics"
  | "announcements";

export function merchantLoadingLabel(context: MerchantLoadingContext = "default"): string {
  switch (context) {
    case "dashboard":
      return "홈 정보 불러오는 중…";
    case "orders":
      return "주문 목록 불러오는 중…";
    case "menus":
      return "메뉴 불러오는 중…";
    case "analytics":
      return "분석 데이터 불러오는 중…";
    case "announcements":
      return "공지 불러오는 중…";
    default:
      return "불러오는 중…";
  }
}

export function merchantDashboardAlertMessage(code: string | undefined): string | null {
  switch (code) {
    case "no_menus_access":
      return "메뉴 수정 권한이 없습니다. 주문 처리는 「주문 큐」를 이용해 주세요.";
    default:
      return null;
  }
}

/** 서버/DB 오류를 점주에게 보여 줄 때 — 상세는 콘솔·운영자용. */
export function merchantOwnerLoadErrorMessage(
  context: "orders" | "metrics" | "notifications" | "menus" | "tables" | "audit",
  detail?: string | null,
): string {
  if (detail && isMerchantInternalUiVisible()) {
    return detail;
  }
  switch (context) {
    case "orders":
      return "주문 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    case "metrics":
      return "오늘 요약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    case "notifications":
      return "알림 목록을 불러오지 못했습니다.";
    case "menus":
      return "메뉴 수를 불러오지 못했습니다.";
    case "tables":
      return "테이블 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    case "audit":
      return "활동 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    default:
      return "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

export function merchantOrdersActionErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  if (isMerchantInternalUiVisible()) {
    switch (code) {
      case "no_service":
        return "서버에 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.";
      case "db":
        return "상태 저장에 실패했습니다. DB 권한·RLS·컬럼을 확인해 주세요.";
      case "no_menus_access":
        return "메뉴 관리는 소장(owner) 또는 메뉴 담당(menu_editor)만 사용할 수 있습니다.";
      case "no_order_mutate":
        return "이 계정 역할로는 주문 상태를 바꿀 수 없습니다. (menu_editor·viewer·finance는 조회만)";
      default:
        break;
    }
  }
  switch (code) {
    case "bad_input":
      return "요청이 올바르지 않습니다. 다시 시도해 주세요.";
    case "no_service":
    case "db":
      return "주문 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    case "no_menus_access":
      return "메뉴 수정 권한이 없습니다.";
    case "no_order_mutate":
      return "이 계정은 주문 상태를 변경할 수 없습니다. 소장·직원 계정으로 로그인해 주세요.";
    case "cancel_reason":
      return "취소 사유를 선택해 주세요.";
    case "batch_limit":
      return `한 번에 접수는 ${80}건까지입니다. 나눠서 접수해 주세요.`;
    case "use_table_pay":
      return "이 주문은 테이블 결제로 처리해 주세요. 상단 테이블 결제 버튼을 사용하세요.";
    case "table_session_not_found":
      return "결제할 테이블 세션을 찾지 못했습니다. 목록을 새로고침해 주세요.";
    case "table_session_empty":
      return "이 테이블에 결제할 주문이 없습니다.";
    case "table_session_not_ready":
      return "테이블의 모든 주문이 서빙완료된 뒤에 결제할 수 있습니다.";
    default:
      return "처리 중 오류가 났습니다. 다시 시도해 주세요.";
  }
}

export function merchantOrdersActionSuccessMessage(code: string | undefined): string | null {
  switch (code) {
    case "status_saved":
      return "주문 상태를 저장했습니다.";
    case "order_paid":
      return "결제를 완료했습니다.";
    case "no_change":
      return "이미 같은 상태입니다.";
    case "batch_accept":
      return "대기 중인 주문을 모두 접수했습니다. 조리중 탭에서 확인하세요.";
    case "batch_none":
      return "접수할 대기 주문이 없습니다.";
    case "table_session_paid":
      return "테이블 결제를 완료했습니다.";
    default:
      return null;
  }
}

export function merchantMenusActionErrorMessage(
  code: string | undefined,
  hint?: string | null,
): string | null {
  if (!code) return null;
  if (isMerchantInternalUiVisible()) {
    switch (code) {
      case "no_service":
        return "서버에 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.";
      case "db":
        return hint?.trim() || "저장에 실패했습니다. DB 제약·RLS·필수 컬럼을 확인해 주세요.";
      case "owner_only_delete":
        return "메뉴 삭제는 소장(owner)만 할 수 있습니다. menu_editor 는 삭제 불가.";
      case "upload":
        return (
          hint?.trim() ||
          "이미지 업로드 실패. Supabase Storage 버킷 menu-images 를 확인해 주세요."
        );
      default:
        break;
    }
  }
  switch (code) {
    case "bad_input":
      return hint?.trim() || "이름·가격 등 입력값을 확인해 주세요.";
    case "no_service":
    case "db":
      return "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    case "owner_only_delete":
      return "메뉴 삭제는 소장만 할 수 있습니다.";
    case "bad_options":
      return hint?.trim() || "옵션 형식을 확인해 주세요. 예: 맵기: 순한,보통,매운 (필수)";
    case "upload":
      return hint?.trim() || "사진을 올리지 못했습니다. 다른 사진으로 다시 시도해 주세요.";
    case "not_found":
      return "메뉴를 찾을 수 없습니다. 목록에서 다시 선택해 주세요.";
    default:
      return "처리 중 오류가 났습니다.";
  }
}

export function merchantMenusActionSuccessMessage(
  ok: string | undefined,
  warn?: string | null,
): string | null {
  if (ok === "saved") {
    const base = "메뉴를 저장했습니다.";
    return warn?.trim() ? `${base} (${warn.trim()})` : base;
  }
  if (ok === "saved_hansik" || ok === "saved_translated") {
    const base =
      "저장했습니다. 한식진흥원 800선 DB에서 공식 이름·설명(영·일·중)을 가져왔어요.";
    return warn?.trim() ? `${base} (${warn.trim()})` : base;
  }
  if (ok === "saved_ai_new" || ok === "saved_ai_translated") {
    const base =
      "저장했습니다. Gemini AI가 이름·설명(영·일·중)과 맵기를 새로 만들었어요.";
    return warn?.trim() ? `${base} (${warn.trim()})` : base;
  }
  if (ok === "saved_ai_cache") {
    const base = "저장했습니다. 이전에 저장된 AI 번역 캐시를 불러왔어요.";
    return warn?.trim() ? `${base} (${warn.trim()})` : base;
  }
  if (ok === "image_saved") {
    const base = "메뉴 사진을 저장했습니다.";
    return warn?.trim() ? `${base} (${warn.trim()})` : base;
  }
  if (ok === "price_saved") {
    return "가격을 저장했습니다.";
  }
  return null;
}

export function merchantNotificationEmailBadgeKo(status: string): string | null {
  switch (status) {
    case "sent":
      return "메일 발송됨";
    case "failed":
      return "메일 실패";
    default:
      return null;
  }
}
