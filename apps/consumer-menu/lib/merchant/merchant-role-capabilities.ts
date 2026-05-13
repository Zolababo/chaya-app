import type { MerchantRole } from "@/lib/merchant/merchant-access";

/** 조회 전용: 운영 큐를 건드리지 않는 계정(viewer·정산 finance). */
export function isMerchantReadOnlyConsoleRole(role: MerchantRole): boolean {
  return role === "viewer" || role === "finance";
}

/** 메뉴·카테고리 CRUD(메뉴 관리 화면). */
export function canManageMerchantMenus(role: MerchantRole): boolean {
  return role === "owner" || role === "menu_editor";
}

/** 메뉴 행 삭제(DB·이미지 삭제) — 복구 어려움으로 소장만. */
export function canDeleteMerchantMenu(role: MerchantRole): boolean {
  return role === "owner";
}

/** 주문 상태 변경 등 주문 큐 변이. */
export function canMutateMerchantOrders(role: MerchantRole): boolean {
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
