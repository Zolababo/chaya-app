import { isMerchantInternalUiVisible } from "@/lib/merchant/merchant-internal-ui";
import { tableCodeFormatHintKo } from "@/lib/tables/tenant-table-code";

function formatDuplicateList(detail: string | null | undefined, max = 8): string {
  const codes = (detail ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, max);
  if (!codes.length) return "";
  const suffix = (detail ?? "").split(",").filter(Boolean).length > max ? "…" : "";
  return ` (${codes.join(", ")}${suffix})`;
}

export function merchantTableErrorMessage(
  code: string | null | undefined,
  detail?: string | null,
): string | null {
  if (!code) return null;
  if (isMerchantInternalUiVisible()) {
    switch (code) {
      case "no_service":
        return "서버에 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.";
      case "no_table_access":
        return "테이블 CRUD는 owner·staff·menu_editor 만 가능합니다.";
      default:
        break;
    }
  }
  switch (code) {
    case "table_code_format":
      return `테이블 번호는 ${tableCodeFormatHintKo()}`;
    case "table_duplicate":
      return detail?.trim()
        ? `테이블 ${detail.trim()}번은 이미 등록되어 있습니다. 다른 번호를 입력하거나 숨긴 테이블을 확인해 주세요.`
        : "이미 등록된 테이블 번호입니다.";
    case "bulk_duplicate":
      return `범위에 이미 등록된 테이블 번호가 있어 추가하지 못했습니다${formatDuplicateList(detail)}. 목록·숨긴 테이블을 확인한 뒤, 겹치지 않는 번호만 다시 추가해 주세요.`;
    case "bulk_too_many":
      return "한 번에 최대 50개까지 추가할 수 있습니다.";
    case "no_service":
    case "save_failed":
      return "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    case "no_menus_access":
      return "테이블 관리 권한이 없습니다.";
    case "no_table_access":
      return "이 계정은 테이블·QR을 추가할 수 없습니다. 소장·직원 계정으로 로그인해 주세요.";
    default:
      return "요청을 처리하지 못했습니다.";
  }
}

export function merchantTableOkMessage(code: string | null | undefined): string | null {
  switch (code) {
    case "added":
      return "테이블을 추가했습니다. 아래 QR을 인쇄하거나 저장해 주세요.";
    case "bulk_added":
      return "테이블을 일괄 추가했습니다. 「전체 인쇄」 또는 「QR 묶음 받기」를 사용하세요.";
    case "activated":
      return "테이블을 다시 사용합니다.";
    case "deactivated":
      return "테이블을 비활성화했습니다.";
    case "deleted":
      return "테이블을 삭제했습니다.";
    default:
      return null;
  }
}
