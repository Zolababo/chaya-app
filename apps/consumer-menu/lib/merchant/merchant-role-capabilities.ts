import type { MerchantRole } from "@/lib/merchant/merchant-access";

/** 조회 전용: 운영 큐를 건드리지 않는 계정(viewer·정산 finance). */
export function isMerchantReadOnlyConsoleRole(role: MerchantRole): boolean {
  return role === "viewer" || role === "finance";
}

/** 메뉴·카테고리 CRUD(메뉴 관리 화면). */
export function canManageMerchantMenus(role: MerchantRole): boolean {
  return role === "owner" || role === "menu_editor";
}

/** 테이블 번호·QR 등록 (홀 운영 — 소장·직원·메뉴 편집). */
export function canManageTenantTables(role: MerchantRole): boolean {
  return role === "owner" || role === "staff" || role === "menu_editor";
}

/** 메뉴 행 삭제(DB·이미지 삭제) — 복구 어려움으로 소장만. */
export function canDeleteMerchantMenu(role: MerchantRole): boolean {
  return role === "owner";
}

/** 주문 상태 변경 등 주문 큐 변이. */
export function canMutateMerchantOrders(role: MerchantRole): boolean {
  return role === "owner" || role === "staff";
}

/** 정산·매출 CSV 등 내보내기. */
export function canExportMerchantSales(role: MerchantRole): boolean {
  return role === "owner" || role === "finance";
}

/** 매장명·로고·소개 등 프로필 설정. */
export function canManageMerchantStoreProfile(role: MerchantRole): boolean {
  return role === "owner";
}

/** 기기 관리 (`/more/staff`) — 1계정·다기기 안내. 직원 초대·권한 토글 없음. */
export function canViewMerchantDeviceHub(_role: MerchantRole): boolean {
  return true;
}

/** @deprecated `canViewMerchantDeviceHub` 사용 */
export function canViewMerchantStaff(role: MerchantRole): boolean {
  return canViewMerchantDeviceHub(role);
}

/** 영업·주문 마감·브레이크타임. */
export function canManageMerchantHours(role: MerchantRole): boolean {
  return role === "owner" || role === "staff";
}

/** 브라우저 웹 푸시 구독(대시보드). 조회 전용 역할은 구독 비활성. */
export function canUseMerchantWebPush(role: MerchantRole): boolean {
  return !isMerchantReadOnlyConsoleRole(role);
}

/** `/m` 가게 선택 등에 쓰는 짧은 한글 라벨. */
export function merchantRoleBadgeKo(role: MerchantRole): string {
  switch (role) {
    case "staff":
      return "직원";
    case "menu_editor":
      return "메뉴";
    case "viewer":
      return "조회";
    case "finance":
      return "정산";
    default:
      return "소장";
  }
}
