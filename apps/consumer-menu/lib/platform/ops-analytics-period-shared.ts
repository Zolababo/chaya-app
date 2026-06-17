export type OpsAnalyticsPeriod = "today" | "7d" | "30d" | "month" | "quarter" | "year";

export const OPS_ANALYTICS_PERIODS: { id: OpsAnalyticsPeriod; label: string }[] = [
  { id: "today", label: "오늘" },
  { id: "7d", label: "7일" },
  { id: "30d", label: "30일" },
  { id: "month", label: "이번달" },
  { id: "quarter", label: "분기" },
  { id: "year", label: "연간" },
];

export function parseOpsAnalyticsPeriod(raw: string | undefined | null): OpsAnalyticsPeriod {
  const id = raw?.trim();
  if (id && OPS_ANALYTICS_PERIODS.some((p) => p.id === id)) {
    return id as OpsAnalyticsPeriod;
  }
  return "today";
}
