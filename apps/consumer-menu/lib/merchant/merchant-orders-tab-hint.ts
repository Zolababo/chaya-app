import type { MerchantOrdersTab } from "@/lib/merchant/merchant-orders-tab";

const HINTS: Record<MerchantOrdersTab, string> = {
  all: "전체 진행 중인 주문을 한눈에 봅니다.",
  pending: "손님이 넣은 주문 — 접수하면 조리중으로 넘어갑니다.",
  cooking: "접수·조리 단계 — 서빙 준비가 되면 다음 버튼을 누르세요.",
  ready: "음식이 준비됨 — 손님에게 낸 뒤 결제 완료를 누르세요.",
  paid: "오늘 결제까지 끝난 주문입니다.",
  cancelled: "오늘 취소된 주문입니다. (취소 사유는 추후 기록 예정)",
};

export function merchantOrdersTabHint(tab: MerchantOrdersTab): string {
  return HINTS[tab];
}
