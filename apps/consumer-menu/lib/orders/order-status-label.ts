const LABELS: Record<string, string> = {
  pending: "접수됨",
  accepted: "주문 확인",
  preparing: "조리 중",
  ready: "픽업·서빙 준비",
  completed: "완료",
  cancelled: "취소됨",
};

export function orderStatusLabel(code: string): string {
  return LABELS[code] ?? code;
}
