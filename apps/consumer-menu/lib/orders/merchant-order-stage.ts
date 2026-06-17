import type { MerchantOrdersTab } from "@/lib/merchant/merchant-orders-tab";
import type { MerchantOrderStatus } from "@/lib/orders/merchant-status-constants";

/** 홈 운영 5단계 — 카드 뱃지·탭 라벨과 동일 톤. */
export function merchantOrderStageLabel(status: string): string {
  switch (status) {
    case "pending":
      return "새 주문";
    case "accepted":
    case "preparing":
      return "조리중";
    case "ready":
      return "서빙완료";
    case "completed":
      return "결제완료";
    case "cancelled":
      return "취소";
    default:
      return status;
  }
}

/** 조리중 탭 내 세부 (accepted / preparing). */
export function merchantOrderCookingDetail(status: string): string | null {
  if (status === "accepted") return "접수·조리 대기";
  if (status === "preparing") return "조리 중";
  return null;
}

/** 주문이 속한 운영 탭. */
export function ordersTabForOrderStatus(status: string): MerchantOrdersTab {
  switch (status) {
    case "pending":
      return "pending";
    case "accepted":
    case "preparing":
      return "cooking";
    case "ready":
      return "ready";
    case "completed":
      return "paid";
    case "cancelled":
      return "cancelled";
    default:
      return "cooking";
  }
}

/** 상태 변경 후 목록이 보여야 할 탭 (다음 단계 화면). */
export function ordersTabAfterStatusChange(newStatus: MerchantOrderStatus): MerchantOrdersTab {
  return ordersTabForOrderStatus(newStatus);
}

export function isMerchantOrdersTerminalTab(tab: MerchantOrdersTab): boolean {
  return tab === "paid" || tab === "cancelled";
}
