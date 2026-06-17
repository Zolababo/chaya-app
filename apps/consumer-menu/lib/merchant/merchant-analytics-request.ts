import type {
  MerchantAnalyticsPeriod,
  MerchantAnalyticsRequest,
} from "@/lib/orders/merchant-analytics";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayKstStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export type MerchantAnalyticsQueryParams = {
  days?: string;
  from?: string;
  to?: string;
  month?: string;
  lastmonth?: string;
};

export function buildMerchantAnalyticsRequest(
  params: MerchantAnalyticsQueryParams,
): { req: MerchantAnalyticsRequest; isLastMonth: boolean } {
  const { days: daysParam, from: fromParam, to: toParam, month: monthParam, lastmonth: lastmonthParam } =
    params;

  if (lastmonthParam) {
    const today = todayKstStr();
    const [y, mo] = today.split("-").map(Number) as [number, number];
    const prevMo = mo === 1 ? 12 : mo - 1;
    const prevY = mo === 1 ? y - 1 : y;
    const lastDay = new Date(prevY, prevMo, 0).getDate();
    const mm = String(prevMo).padStart(2, "0");
    return {
      req: { kind: "range", from: `${prevY}-${mm}-01`, to: `${prevY}-${mm}-${lastDay}` },
      isLastMonth: true,
    };
  }
  if (monthParam) return { req: { kind: "month" }, isLastMonth: false };
  if (fromParam && toParam && DATE_RE.test(fromParam) && DATE_RE.test(toParam) && fromParam <= toParam) {
    return { req: { kind: "range", from: fromParam, to: toParam }, isLastMonth: false };
  }
  const d = Number(daysParam);
  const days: MerchantAnalyticsPeriod = d === 7 ? 7 : d === 30 ? 30 : 1;
  return { req: { kind: "period", days }, isLastMonth: false };
}

export function merchantAnalyticsLiveQuery(params: MerchantAnalyticsQueryParams): string {
  const q = new URLSearchParams();
  if (params.days) q.set("days", params.days);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.month) q.set("month", params.month);
  if (params.lastmonth) q.set("lastmonth", params.lastmonth);
  const s = q.toString();
  return s ? `?${s}` : "";
}
