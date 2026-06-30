const LABELS: Record<string, string> = {
  pending: "접수됨",
  accepted: "주문 확인",
  preparing: "조리 중",
  ready: "서빙 완료",
  completed: "결제 완료",
  cancelled: "취소됨",
};

export function orderStatusLabel(code: string): string {
  return LABELS[code] ?? code;
}
