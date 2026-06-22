import "server-only";

import {
  fetchMerchantAnalyticsBundleRpc,
  fetchMerchantAnalyticsCoreRpc,
  fetchMerchantAnalyticsTopMenusRpc,
  fetchMerchantTodayMetricsRpc,
} from "@/lib/orders/merchant-analytics-rpc";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

const MAX_ORDERS = 2500;
const KST = "Asia/Seoul";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

const CANCEL_REASON_LABEL: Record<string, string> = {
  out_of_stock: "재료 소진",
  store_closing: "영업 종료",
  duplicate: "중복 주문",
  customer_request: "고객 요청",
  other: "기타",
};

export type MerchantAnalyticsPeriod = 1 | 7 | 30;

export type MerchantAnalyticsSnapshot =
  | {
      ok: true;
      days: number;
      orderCount: number;
      totalSales: number;
      completedCount: number;
      cancelledCount: number;
      /** 현재 기간 일별 데이터 */
      daily: { key: string; label: string; fullLabel: string; orders: number; sales: number }[];
      /** 전 기간 일별 데이터 (비교용, 인덱스 대응) */
      prevDaily: { key: string; orders: number; sales: number }[];
      hourly: { hour: number; label: string; orders: number; sales: number }[];
      byWeekday: { dow: number; label: string; orders: number; sales: number }[];
      topMenus: { menuId: string; name: string; qty: number }[];
      cancelReasons: { reason: string; label: string; count: number }[];
    }
  | { ok: false; message: string };

function parsePrice(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function kstDateKey(iso: string): string | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toLocaleDateString("en-CA", { timeZone: KST });
}

function kstHour(iso: string): number | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const h = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: KST, hour: "numeric", hour12: false }).format(
      new Date(t),
    ),
  );
  return Number.isFinite(h) ? h : null;
}

function kstWeekday(iso: string): number | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: KST, weekday: "short" }).format(
    new Date(t),
  );
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? null;
}

function parseOrderLine(elem: unknown): { id: string; qty: number } | null {
  if (!elem || typeof elem !== "object") return null;
  const rec = elem as Record<string, unknown>;
  const id = typeof rec.id === "string" ? rec.id.trim() : "";
  if (!id) return null;
  const qtyRaw = typeof rec.quantity === "number" ? rec.quantity : Number(rec.quantity);
  const qty = Number.isFinite(qtyRaw) ? Math.max(1, Math.min(99, Math.floor(qtyRaw))) : 1;
  return { id, qty };
}

export type MerchantTodayKstMetrics =
  | {
      ok: true;
      dateKey: string;
      dateLabel: string;
      orderCount: number;
      totalSales: number;
      cancelledCount: number;
      /** 어제 매출 (비교용, 데이터 없으면 null) */
      yesterdaySales: number | null;
      yesterdayOrderCount: number | null;
    }
  | { ok: false; message: string };

/** KST 기준 당일 00:00~익일 00:00 (UTC ISO). */
export function getKstCalendarDayBounds(nowMs = Date.now()): {
  dateKey: string;
  dateLabel: string;
  sinceIso: string;
  untilIso: string;
} {
  const dateKey = new Date(nowMs).toLocaleDateString("en-CA", { timeZone: KST });
  const since = new Date(`${dateKey}T00:00:00+09:00`);
  const until = new Date(since.getTime() + 24 * 60 * 60 * 1000);
  const dateLabel = since.toLocaleDateString("ko-KR", {
    timeZone: KST,
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  return { dateKey, dateLabel, sinceIso: since.toISOString(), untilIso: until.toISOString() };
}

/** 점주 홈 — **오늘(영업일)** 매출·주문. 롤링 24시간 아님. */
export async function getMerchantTodayKstMetrics(tenantSlug: string): Promise<MerchantTodayKstMetrics> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "테넌트가 없습니다." };

  const client = createServiceSupabase();
  if (!client) {
    return {
      ok: false,
      message:
        "Supabase 서버 설정이 없습니다. SUPABASE_SERVICE_ROLE_KEY와 URL을 확인한 뒤 다시 시도해 주세요.",
    };
  }

  const { dateKey, dateLabel, sinceIso, untilIso } = getKstCalendarDayBounds();
  const { sinceIso: ySinceIso, untilIso: yUntilIso } = getKstCalendarDayBounds(
    Date.now() - 24 * 60 * 60 * 1000,
  );

  const rpc = await fetchMerchantTodayMetricsRpc(
    client,
    slug,
    sinceIso,
    untilIso,
    ySinceIso,
    yUntilIso,
  );

  if (rpc) {
    return {
      ok: true,
      dateKey,
      dateLabel,
      orderCount: rpc.today.order_count,
      totalSales: rpc.today.total_sales,
      cancelledCount: rpc.today.cancelled_count,
      yesterdaySales: rpc.yesterday.total_sales,
      yesterdayOrderCount: rpc.yesterday.order_count,
    };
  }

  // RPC 미적용 DB — 행 스캔 fallback (매출은 completed_at 우선)
  const [{ data, error }, { data: ySalesData }, { data: yDataLegacy }] = await Promise.all([
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("total_price, status, completed_at")
        .eq("tenant_slug", slug)
        .gte("created_at", sinceIso)
        .lt("created_at", untilIso),
    ),
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("total_price, status, completed_at")
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .gte("completed_at", ySinceIso)
        .lt("completed_at", yUntilIso),
    ),
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("total_price, status")
        .eq("tenant_slug", slug)
        .gte("created_at", ySinceIso)
        .lt("created_at", yUntilIso),
    ),
  ]);

  if (error) {
    return { ok: false, message: error.message ?? "오늘 주문 집계를 불러오지 못했습니다." };
  }

  let totalSales = 0;
  let orderCount = 0;
  let cancelledCount = 0;
  for (const row of data ?? []) {
    orderCount += 1;
    const status = typeof row.status === "string" ? row.status : "";
    if (status === "cancelled") {
      cancelledCount += 1;
    }
    const completedAt =
      typeof row.completed_at === "string" ? row.completed_at : null;
    if (
      status === "completed" &&
      completedAt &&
      completedAt >= sinceIso &&
      completedAt < untilIso
    ) {
      totalSales += parsePrice(row.total_price);
    }
  }

  let yesterdaySales: number | null = null;
  let yesterdayOrderCount: number | null = null;
  if (ySalesData && ySalesData.length > 0) {
    yesterdaySales = 0;
    yesterdayOrderCount = 0;
    for (const row of ySalesData) {
      yesterdayOrderCount += 1;
      yesterdaySales += parsePrice(row.total_price);
    }
  } else if (yDataLegacy) {
    yesterdaySales = 0;
    yesterdayOrderCount = 0;
    for (const row of yDataLegacy) {
      const status = typeof row.status === "string" ? row.status : "";
      if (status !== "completed") continue;
      yesterdayOrderCount += 1;
      yesterdaySales += parsePrice(row.total_price);
    }
  }

  return {
    ok: true,
    dateKey,
    dateLabel,
    orderCount,
    totalSales,
    cancelledCount,
    yesterdaySales,
    yesterdayOrderCount,
  };
}

function buildDailyKeys(
  sinceMs: number,
  untilMs: number,
): { key: string; label: string; fullLabel: string }[] {
  // untilMs의 KST 날짜 키를 기준으로 루프 종료 → "내일" 포함 버그 방지
  const untilKey = new Date(untilMs).toLocaleDateString("en-CA", { timeZone: KST });
  const out: { key: string; label: string; fullLabel: string }[] = [];
  let cur = sinceMs;
  for (let guard = 0; guard < 400; guard++) {
    const d = new Date(cur);
    const key = d.toLocaleDateString("en-CA", { timeZone: KST });
    if (key > untilKey) break;
    // X축 레이블: "5/21" 형식
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: KST,
      month: "numeric",
      day: "numeric",
    }).formatToParts(d);
    const m = parts.find((p) => p.type === "month")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const label = `${m}/${day}`;
    // 툴팁용 fullLabel: "5/21(목)"
    const wd = WEEKDAY_KO[d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];
    const fullLabel = `${label}(${wd})`;
    if (out.length === 0 || out[out.length - 1]!.key !== key) out.push({ key, label, fullLabel });
    cur += 24 * 60 * 60 * 1000;
  }
  return out;
}

export type MerchantAnalyticsRequest =
  | { kind: "period"; days: MerchantAnalyticsPeriod }
  | { kind: "range"; from: string; to: string } // YYYY-MM-DD KST
  | { kind: "month" }; // 이번 달 (KST 1일~오늘)

export type MerchantAnalyticsTimeBounds =
  | { ok: true; sinceIso: string; untilIso: string; periodLabel: string }
  | { ok: false; message: string };

/** 매출·손님 분석 공통 KST 기간 (결제완료 집계용 `untilIso` 포함). */
export function resolveMerchantAnalyticsTimeBounds(
  req: MerchantAnalyticsRequest,
): MerchantAnalyticsTimeBounds {
  let sinceMs: number;
  let untilMs: number;
  let periodLabel: string;

  if (req.kind === "month") {
    const nowMs = Date.now();
    const todayKey = new Date(nowMs).toLocaleDateString("en-CA", { timeZone: KST });
    const [y, mo] = todayKey.split("-").map(Number) as [number, number];
    sinceMs = new Date(`${y}-${String(mo).padStart(2, "0")}-01T00:00:00+09:00`).getTime();
    untilMs = new Date(`${todayKey}T23:59:59.999+09:00`).getTime();
    periodLabel = "이번 달";
  } else if (req.kind === "range") {
    const fromMs = new Date(`${req.from}T00:00:00+09:00`).getTime();
    const toMs = new Date(`${req.to}T23:59:59.999+09:00`).getTime();
    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
      return { ok: false, message: "기간 설정이 올바르지 않습니다." };
    }
    sinceMs = fromMs;
    untilMs = toMs;
    periodLabel = `${req.from.slice(5)} ~ ${req.to.slice(5)}`;
  } else {
    const nowMs = Date.now();
    const todayKey = new Date(nowMs).toLocaleDateString("en-CA", { timeZone: KST });
    untilMs = new Date(`${todayKey}T23:59:59.999+09:00`).getTime();
    const startKey = new Date(nowMs - (req.days - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(
      "en-CA",
      { timeZone: KST },
    );
    sinceMs = new Date(`${startKey}T00:00:00+09:00`).getTime();
    periodLabel =
      req.days === 1 ? "오늘" : req.days === 7 ? "최근 7일" : req.days === 30 ? "최근 30일" : `최근 ${req.days}일`;
  }

  return {
    ok: true,
    sinceIso: new Date(sinceMs).toISOString(),
    untilIso: new Date(untilMs).toISOString(),
    periodLabel,
  };
}

/** 점주 분석 보드 — 일별·시간대·요일·인기 메뉴 (주문 스캔 기반). */
export async function getMerchantAnalytics(
  tenantSlug: string,
  req: MerchantAnalyticsRequest,
): Promise<MerchantAnalyticsSnapshot> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "테넌트가 없습니다." };

  const client = createServiceSupabase();
  if (!client) {
    return {
      ok: false,
      message:
        "Supabase 서버 설정이 없습니다. SUPABASE_SERVICE_ROLE_KEY와 URL을 확인한 뒤 다시 시도해 주세요.",
    };
  }

  let sinceMs: number;
  let untilMs: number;
  let days: number;

  if (req.kind === "month") {
    const nowMs = Date.now();
    const todayKey = new Date(nowMs).toLocaleDateString("en-CA", { timeZone: KST });
    const [y, mo] = todayKey.split("-").map(Number) as [number, number];
    sinceMs = new Date(`${y}-${String(mo).padStart(2, "0")}-01T00:00:00+09:00`).getTime();
    untilMs = new Date(`${todayKey}T23:59:59+09:00`).getTime();
    days = Math.round((untilMs - sinceMs) / (24 * 60 * 60 * 1000)) + 1;
  } else if (req.kind === "range") {
    const fromMs = new Date(`${req.from}T00:00:00+09:00`).getTime();
    const toMs = new Date(`${req.to}T23:59:59+09:00`).getTime();
    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
      return { ok: false, message: "기간 설정이 올바르지 않습니다." };
    }
    sinceMs = fromMs;
    untilMs = toMs;
    days = Math.round((untilMs - sinceMs) / (24 * 60 * 60 * 1000)) + 1;
  } else {
    // period
    const nowMs = Date.now();
    const todayKey = new Date(nowMs).toLocaleDateString("en-CA", { timeZone: KST });
    untilMs = new Date(`${todayKey}T23:59:59+09:00`).getTime();
    const startKey = new Date(nowMs - (req.days - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(
      "en-CA",
      { timeZone: KST },
    );
    sinceMs = new Date(`${startKey}T00:00:00+09:00`).getTime();
    days = req.days;
  }

  // 이전 기간 범위 (비교용)
  const duration = untilMs - sinceMs;
  const prevSinceMs = sinceMs - duration - 1;
  const prevUntilMs = sinceMs - 1;

  const sinceIso = new Date(sinceMs).toISOString();
  const untilIso = new Date(untilMs).toISOString();
  const prevSinceIso = new Date(prevSinceMs).toISOString();
  const prevUntilIso = new Date(prevUntilMs).toISOString();

  const bundle = await fetchMerchantAnalyticsBundleRpc(
    client,
    slug,
    sinceIso,
    untilIso,
    prevSinceIso,
    prevUntilIso,
    MAX_ORDERS,
  );

  let core = bundle?.current ?? null;
  let prevCore = bundle?.previous ?? null;
  let topMenusRpc: { menuId: string; name: string; qty: number }[] | null = null;

  if (bundle) {
    topMenusRpc = await resolveTopMenuNames(client, slug, bundle.top_menus);
  } else {
    const [coreRpc, prevCoreRpc, topMenusFallback] = await Promise.all([
      fetchMerchantAnalyticsCoreRpc(client, slug, sinceIso, untilIso, MAX_ORDERS),
      fetchMerchantAnalyticsCoreRpc(client, slug, prevSinceIso, prevUntilIso, MAX_ORDERS),
      fetchTopMenusForAnalytics(client, slug, sinceIso, untilIso),
    ]);
    core = coreRpc;
    prevCore = prevCoreRpc;
    topMenusRpc = topMenusFallback;
  }

  if (core) {
    const dailyKeys = buildDailyKeys(sinceMs, untilMs);
    const dailyMap = new Map(core.daily.map((d) => [d.day_key, d]));
    const daily = dailyKeys.map(({ key, label, fullLabel }) => {
      const b = dailyMap.get(key);
      return { key, label, fullLabel, orders: b?.orders ?? 0, sales: b?.sales ?? 0 };
    });

    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour}시`,
      orders: 0,
      sales: 0,
    }));
    for (const h of core.hourly) {
      if (h.hour >= 0 && h.hour < 24) {
        hourly[h.hour]!.orders = h.orders;
        hourly[h.hour]!.sales = h.sales;
      }
    }

    const dowMap = new Map(core.by_dow.map((w) => [w.dow, w]));
    const byWeekday = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
      const b = dowMap.get(dow);
      return {
        dow,
        label: `${WEEKDAY_KO[dow]}요일`,
        orders: b?.orders ?? 0,
        sales: b?.sales ?? 0,
      };
    });

    const prevDailyKeys = buildDailyKeys(prevSinceMs, prevUntilMs);
    const prevDailyMap = new Map((prevCore?.daily ?? []).map((d) => [d.day_key, d]));
    const prevDaily = prevDailyKeys.map(({ key }) => {
      const b = prevDailyMap.get(key);
      return { key, orders: b?.orders ?? 0, sales: b?.sales ?? 0 };
    });

    const cancelReasons = core.cancel_reasons.map(({ reason, cnt }) => ({
      reason,
      label: CANCEL_REASON_LABEL[reason] ?? reason,
      count: cnt,
    }));

    return {
      ok: true,
      days,
      orderCount: core.totals.order_count,
      totalSales: core.totals.total_sales,
      completedCount: core.totals.completed_count,
      cancelledCount: core.totals.cancelled_count,
      daily,
      prevDaily,
      hourly,
      byWeekday,
      topMenus: topMenusRpc,
      cancelReasons,
    };
  }

  // RPC 미적용 DB — Node 스캔 폴백
  // cancel_reason 컬럼이 없는 환경을 위해 폴백 재시도
  const buildMainQuery = (withCancelReason: boolean) =>
    client
      .from("orders")
      .select(
        withCancelReason
          ? "created_at, total_price, status, items, cancel_reason"
          : "created_at, total_price, status, items",
      )
      .eq("tenant_slug", slug)
      .gte("created_at", sinceIso)
      .lte("created_at", untilIso)
      .order("created_at", { ascending: false })
      .limit(MAX_ORDERS);

  let mainResult = await withSupabaseReadRetry(() => buildMainQuery(true));
  if (
    mainResult.error &&
    /cancel_reason|column.*does not exist/i.test(mainResult.error.message ?? "")
  ) {
    mainResult = await withSupabaseReadRetry(() => buildMainQuery(false));
  }

  const { data: rawData, error } = mainResult;

  const [{ data: prevData }] = await Promise.all([
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("created_at, total_price, status")
        .eq("tenant_slug", slug)
        .gte("created_at", prevSinceIso)
        .lte("created_at", prevUntilIso)
        .limit(MAX_ORDERS),
    ),
  ]);

  // unknown[] 캐스트: cancel_reason 유무에 따라 타입이 달라질 수 있음
  const data = (rawData as unknown[]) ?? [];

  if (error) {
    return { ok: false, message: error.message ?? "주문 데이터를 불러오지 못했습니다." };
  }

  const dailyKeys = buildDailyKeys(sinceMs, untilMs);
  const dailyMap = new Map(dailyKeys.map((d) => [d.key, { orders: 0, sales: 0 }]));
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${hour}시`,
    orders: 0,
    sales: 0,
  }));
  const dowMap = new Map<number, { orders: number; sales: number }>();
  for (let d = 0; d < 7; d++) dowMap.set(d, { orders: 0, sales: 0 });

  const menuQty = new Map<string, number>();
  const reasonQty = new Map<string, number>();
  let totalSales = 0;
  let completedCount = 0;
  let cancelledCount = 0;

  for (const rawRow of data) {
    const row = rawRow as Record<string, unknown>;
    const created = typeof row.created_at === "string" ? row.created_at : "";
    const status = typeof row.status === "string" ? row.status : "";
    const price = parsePrice(row.total_price);
    const countsForSales = status !== "cancelled";

    if (status === "cancelled") {
      cancelledCount += 1;
      // cancel_reason 집계 — created_at 시각 기준 (취소 시각 근사치)
      const rawReason = (row as Record<string, unknown>).cancel_reason;
      const reason =
        typeof rawReason === "string" && rawReason.trim()
          ? rawReason.trim()
          : "other";
      reasonQty.set(reason, (reasonQty.get(reason) ?? 0) + 1);
    }
    if (status === "completed") completedCount += 1;

    if (countsForSales) totalSales += price;

    const dateKey = created ? kstDateKey(created) : null;
    if (dateKey && dailyMap.has(dateKey)) {
      const bucket = dailyMap.get(dateKey)!;
      bucket.orders += 1;
      if (countsForSales) bucket.sales += price;
    }

    const hour = created ? kstHour(created) : null;
    if (hour != null) {
      hourly[hour]!.orders += 1;
      if (countsForSales) hourly[hour]!.sales += price;
    }

    const dow = created ? kstWeekday(created) : null;
    if (dow != null) {
      const w = dowMap.get(dow)!;
      w.orders += 1;
      if (countsForSales) w.sales += price;
    }

    const itemsRaw = row.items;
    if (Array.isArray(itemsRaw) && countsForSales) {
      for (const elem of itemsRaw) {
        const line = parseOrderLine(elem);
        if (!line) continue;
        menuQty.set(line.id, (menuQty.get(line.id) ?? 0) + line.qty);
      }
    }
  }

  const rankedIds = [...menuQty.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([id]) => id);

  const nameById = new Map<string, string>();
  if (rankedIds.length > 0) {
    const { data: menus } = await client
      .from("ChayaMenus")
      .select("id, name")
      .eq("tenant_slug", slug)
      .in("id", rankedIds);
    for (const m of menus ?? []) {
      const id = typeof m.id === "string" ? m.id : String(m.id ?? "");
      const name = typeof m.name === "string" ? m.name : "메뉴";
      if (id) nameById.set(id, name);
    }
  }

  const topMenus = rankedIds.map((menuId) => ({
    menuId,
    name: nameById.get(menuId) ?? "삭제된 메뉴",
    qty: menuQty.get(menuId) ?? 0,
  }));

  // 이전 기간 집계 (비교용)
  const prevDailyKeys = buildDailyKeys(prevSinceMs, prevUntilMs);
  const prevDailyMap = new Map(prevDailyKeys.map((d) => [d.key, { orders: 0, sales: 0 }]));
  for (const row of prevData ?? []) {
    const created = typeof row.created_at === "string" ? row.created_at : "";
    const status = typeof row.status === "string" ? row.status : "";
    const price = parsePrice((row as Record<string, unknown>).total_price);
    const countsForSales = status !== "cancelled";
    const dateKey = created ? kstDateKey(created) : null;
    if (dateKey && prevDailyMap.has(dateKey)) {
      const bucket = prevDailyMap.get(dateKey)!;
      bucket.orders += 1;
      if (countsForSales) bucket.sales += price;
    }
  }
  const prevDaily = prevDailyKeys.map(({ key }) => {
    const b = prevDailyMap.get(key) ?? { orders: 0, sales: 0 };
    return { key, orders: b.orders, sales: b.sales };
  });

  const daily = dailyKeys.map(({ key, label, fullLabel }) => {
    const b = dailyMap.get(key) ?? { orders: 0, sales: 0 };
    return { key, label, fullLabel, orders: b.orders, sales: b.sales };
  });

  const byWeekday = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
    const b = dowMap.get(dow) ?? { orders: 0, sales: 0 };
    return { dow, label: `${WEEKDAY_KO[dow]}요일`, orders: b.orders, sales: b.sales };
  });

  const cancelReasons = [...reasonQty.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({
      reason,
      label: CANCEL_REASON_LABEL[reason] ?? reason,
      count,
    }));

  return {
    ok: true,
    days,
    orderCount: data.length,
    totalSales,
    completedCount,
    cancelledCount,
    daily,
    prevDaily,
    hourly,
    byWeekday,
    topMenus,
    cancelReasons,
  };
}

async function fetchTopMenusForAnalytics(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  sinceIso: string,
  untilIso: string,
): Promise<{ menuId: string; name: string; qty: number }[]> {
  const rpcRows = await fetchMerchantAnalyticsTopMenusRpc(client, slug, sinceIso, untilIso);
  if (rpcRows !== null) {
    return resolveTopMenuNames(client, slug, rpcRows);
  }

  const { data } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("items")
      .eq("tenant_slug", slug)
      .gte("created_at", sinceIso)
      .lte("created_at", untilIso)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(600),
  );

  const menuQty = new Map<string, number>();
  for (const row of (data as { items?: unknown }[]) ?? []) {
    if (!Array.isArray(row.items)) continue;
    for (const elem of row.items) {
      const line = parseOrderLine(elem);
      if (!line) continue;
      menuQty.set(line.id, (menuQty.get(line.id) ?? 0) + line.qty);
    }
  }

  const rankedIds = [...menuQty.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([id, qty]) => ({ menu_id: id, qty }));

  return resolveTopMenuNames(client, slug, rankedIds);
}

async function resolveTopMenuNames(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  ranked: { menu_id: string; qty: number }[],
): Promise<{ menuId: string; name: string; qty: number }[]> {
  const rankedIds = ranked.map((r) => r.menu_id);
  const menuQty = new Map(ranked.map((r) => [r.menu_id, r.qty]));

  const nameById = new Map<string, string>();
  if (rankedIds.length > 0) {
    const { data: menus } = await client
      .from("ChayaMenus")
      .select("id, name")
      .eq("tenant_slug", slug)
      .in("id", rankedIds);
    for (const m of menus ?? []) {
      const id = typeof m.id === "string" ? m.id : String(m.id ?? "");
      const name = typeof m.name === "string" ? m.name : "메뉴";
      if (id) nameById.set(id, name);
    }
  }

  return rankedIds.map((menuId) => ({
    menuId,
    name: nameById.get(menuId) ?? "삭제된 메뉴",
    qty: menuQty.get(menuId) ?? 0,
  }));
}
