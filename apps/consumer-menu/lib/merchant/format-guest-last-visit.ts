import type { OrderLineSummary } from "@/lib/orders/format-order-line-summary";

const KST = "Asia/Seoul";

export function formatGuestVisitDateKst(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleDateString("ko-KR", {
    timeZone: KST,
    month: "numeric",
    day: "numeric",
  });
}

export function formatGuestItemsBrief(lines: OrderLineSummary[], maxNames = 2): string {
  if (lines.length === 0) return "";
  const names = lines.slice(0, maxNames).map((l) => l.name);
  const text = names.join(", ");
  const extra = lines.length - maxNames;
  return extra > 0 ? `${text} 외 ${extra}개` : text;
}

export function formatGuestLastVisitLine(input: {
  completedAt: string;
  totalPrice: number;
  itemsSummary: string;
}): string {
  const date = formatGuestVisitDateKst(input.completedAt);
  const price = input.totalPrice.toLocaleString("ko-KR");
  const items = input.itemsSummary.trim();
  if (!date) return items ? `${price}원 · ${items}` : `${price}원`;
  if (!items) return `지난번 ${date} · ${price}원`;
  return `지난번 ${date} · ${price}원 · ${items}`;
}
