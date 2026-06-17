import "server-only";

import { getKstCalendarDayBounds } from "@/lib/orders/merchant-analytics";
import type { PlatformSalesTrendDay } from "@/lib/platform/platform-analytics";
import {
  type OpsAnalyticsPeriod,
  OPS_ANALYTICS_PERIODS,
  parseOpsAnalyticsPeriod,
} from "@/lib/platform/ops-analytics-period-shared";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

export type { OpsAnalyticsPeriod } from "@/lib/platform/ops-analytics-period-shared";
export { OPS_ANALYTICS_PERIODS, parseOpsAnalyticsPeriod };

const KST = "Asia/Seoul";

function parsePrice(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function kstDateKey(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: KST });
}

function kstMonthKey(ms: number): string {
  return kstDateKey(ms).slice(0, 7);
}

function startOfKstDayMs(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00+09:00`);
}

export function getOpsPeriodWindow(
  period: OpsAnalyticsPeriod,
  nowMs = Date.now(),
): { sinceIso: string; untilIso: string; periodLabel: string; menuTrendDays: number } {
  const { untilIso } = getKstCalendarDayBounds(nowMs);
  const todayKey = kstDateKey(nowMs);

  if (period === "today") {
    const { sinceIso, dateLabel } = getKstCalendarDayBounds(nowMs);
    return { sinceIso, untilIso, periodLabel: dateLabel, menuTrendDays: 1 };
  }

  if (period === "7d") {
    const sinceMs = startOfKstDayMs(todayKey) - 6 * 86400000;
    return {
      sinceIso: new Date(sinceMs).toISOString(),
      untilIso,
      periodLabel: "최근 7일",
      menuTrendDays: 7,
    };
  }

  if (period === "30d") {
    const sinceMs = startOfKstDayMs(todayKey) - 29 * 86400000;
    return {
      sinceIso: new Date(sinceMs).toISOString(),
      untilIso,
      periodLabel: "최근 30일",
      menuTrendDays: 30,
    };
  }

  const [y, mo] = todayKey.split("-").map(Number);

  if (period === "month") {
    const sinceIso = new Date(`${y}-${String(mo).padStart(2, "0")}-01T00:00:00+09:00`).toISOString();
    return {
      sinceIso,
      untilIso,
      periodLabel: `${y}년 ${mo}월`,
      menuTrendDays: Math.max(1, Math.floor((nowMs - Date.parse(sinceIso)) / 86400000) + 1),
    };
  }

  if (period === "quarter") {
    const qStartMonth = Math.floor((mo - 1) / 3) * 3 + 1;
    const sinceIso = new Date(`${y}-${String(qStartMonth).padStart(2, "0")}-01T00:00:00+09:00`).toISOString();
    return {
      sinceIso,
      untilIso,
      periodLabel: `${y}년 Q${Math.floor((mo - 1) / 3) + 1}`,
      menuTrendDays: 90,
    };
  }

  const sinceIso = new Date(`${y}-01-01T00:00:00+09:00`).toISOString();
  return {
    sinceIso,
    untilIso,
    periodLabel: `${y}년`,
    menuTrendDays: 365,
  };
}

export type PlatformPeriodAnalytics =
  | {
      ok: true;
      period: OpsAnalyticsPeriod;
      periodLabel: string;
      totalSales: number;
      totalOrders: number;
      cancelledOrders: number;
      salesTrend: PlatformSalesTrendDay[];
      chartSubtitle: string;
    }
  | { ok: false; message: string };

function buildDailyTrend(
  sinceMs: number,
  untilMs: number,
  salesByDay: Map<string, number>,
): PlatformSalesTrendDay[] {
  const todayKey = kstDateKey(Date.now());
  const keys: string[] = [];
  for (let t = sinceMs; t < untilMs; t += 86400000) {
    keys.push(kstDateKey(t));
  }
  const slice = keys.length > 31 ? keys.slice(-31) : keys;
  return slice.map((key) => {
    const [, mo, da] = key.split("-");
    return {
      label: key === todayKey ? "오늘" : `${Number(mo)}/${Number(da)}`,
      sales: salesByDay.get(key) ?? 0,
      isToday: key === todayKey,
    };
  });
}

function buildWeeklyTrend(
  sinceMs: number,
  untilMs: number,
  salesByDay: Map<string, number>,
): PlatformSalesTrendDay[] {
  const buckets: PlatformSalesTrendDay[] = [];
  let weekStart = sinceMs;
  while (weekStart < untilMs) {
    const weekEnd = Math.min(weekStart + 7 * 86400000, untilMs);
    let sales = 0;
    for (let t = weekStart; t < weekEnd; t += 86400000) {
      sales += salesByDay.get(kstDateKey(t)) ?? 0;
    }
    const startLabel = kstDateKey(weekStart).slice(5).replace("-", "/");
    buckets.push({ label: startLabel, sales, isToday: weekEnd >= untilMs - 86400000 });
    weekStart = weekEnd;
  }
  return buckets.slice(-14);
}

function buildMonthlyTrend(
  sinceMs: number,
  salesByDay: Map<string, number>,
): PlatformSalesTrendDay[] {
  const byMonth = new Map<string, number>();
  for (const [day, sales] of salesByDay) {
    const mk = day.slice(0, 7);
    byMonth.set(mk, (byMonth.get(mk) ?? 0) + sales);
  }
  const startMonth = kstMonthKey(sinceMs);
  const endMonth = kstMonthKey(Date.now());
  const keys: string[] = [];
  let [y, m] = startMonth.split("-").map(Number);
  for (;;) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    keys.push(key);
    if (key >= endMonth) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return keys.map((key) => {
    const [, mo] = key.split("-");
    return {
      label: `${Number(mo)}월`,
      sales: byMonth.get(key) ?? 0,
      isToday: key === endMonth,
    };
  });
}

export async function getPlatformPeriodAnalytics(
  period: OpsAnalyticsPeriod,
): Promise<PlatformPeriodAnalytics> {
  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "Supabase 서버 설정(SERVICE_ROLE)이 없습니다." };
  }

  const window = getOpsPeriodWindow(period);
  const sinceMs = Date.parse(window.sinceIso);
  const untilMs = Date.parse(window.untilIso);

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("total_price, status, created_at")
      .gte("created_at", window.sinceIso)
      .lt("created_at", window.untilIso),
  );

  if (error) {
    return { ok: false, message: error.message ?? "주문 집계를 불러오지 못했습니다." };
  }

  let totalSales = 0;
  let totalOrders = 0;
  let cancelledOrders = 0;
  const salesByDay = new Map<string, number>();

  for (const row of data ?? []) {
    totalOrders += 1;
    const status = typeof row.status === "string" ? row.status : "";
    if (status === "cancelled") {
      cancelledOrders += 1;
      continue;
    }
    const price = parsePrice(row.total_price);
    totalSales += price;
    const created = typeof row.created_at === "string" ? row.created_at : "";
    if (!created) continue;
    const key = kstDateKey(Date.parse(created));
    salesByDay.set(key, (salesByDay.get(key) ?? 0) + price);
  }

  const spanDays = Math.max(1, Math.ceil((untilMs - sinceMs) / 86400000));
  let salesTrend: PlatformSalesTrendDay[];
  let chartSubtitle: string;

  if (period === "year") {
    salesTrend = buildMonthlyTrend(sinceMs, salesByDay);
    chartSubtitle = "월별 매출 · 전체 매장 합산 (원)";
  } else if (period === "quarter" || spanDays > 31) {
    salesTrend = buildWeeklyTrend(sinceMs, untilMs, salesByDay);
    chartSubtitle = "주별 매출 · 전체 매장 합산 (원)";
  } else {
    salesTrend = buildDailyTrend(sinceMs, untilMs, salesByDay);
    chartSubtitle = "일별 매출 · 전체 매장 합산 (원)";
  }

  return {
    ok: true,
    period,
    periodLabel: window.periodLabel,
    totalSales,
    totalOrders,
    cancelledOrders,
    salesTrend,
    chartSubtitle,
  };
}
