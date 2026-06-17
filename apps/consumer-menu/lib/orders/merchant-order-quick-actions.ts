import type { MerchantOrderStatus } from "@/lib/orders/merchant-status-constants";

export type MerchantOrderQuickAction = {
  status: MerchantOrderStatus;
  label: string;
  tone: "primary" | "neutral" | "danger";
  confirm?: string;
};

/**
 * 주문 카드 — 3단계 버튼 (주문→준비중→서빙 완료→결제 완료).
 * accepted·preparing 모두 「서빙 완료」 버튼으로 통합.
 */
export function merchantOrderQuickActions(current: string): MerchantOrderQuickAction[] {
  switch (current) {
    case "pending":
      return [
        { status: "preparing", label: "준비중", tone: "primary" },
        { status: "cancelled", label: "주문 취소", tone: "danger" },
      ];
    case "accepted":
    case "preparing":
      return [
        { status: "ready", label: "서빙 완료", tone: "primary" },
        { status: "cancelled", label: "주문 취소", tone: "danger" },
      ];
    case "ready":
      return [{ status: "completed", label: "결제", tone: "primary" }];
    default:
      return [];
  }
}
