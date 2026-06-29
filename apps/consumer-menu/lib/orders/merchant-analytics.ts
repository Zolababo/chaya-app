import "server-only";

import {
  fetchMerchantAnalyticsBundleRpc,
  fetchMerchantAnalyticsCoreRpc,
  fetchMerchantAnalyticsTopMenusRpc,
  fetchMerchantTodayMetricsRpc,
} from "@/lib/orders/merchant-analytics-rpc";
import { countPaymentEventsFromOrderRows } from "@/lib/merchant/payment-event-count";
import {
  getTenantCurrentBusinessDayBounds,
  getTenantPreviousBusinessDayBounds,
  resolveTenantAnalyticsTimeBounds,
} from "@/lib/merchant/resolve-tenant-analytics-bounds";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";
import {
  buildBusinessDayChartKeys,
  businessDayKeyFromIso,
  KST,
} from "@/lib/tenant/merchant-business-day";

const MAX_ORDERS = 2500;

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
      /** 영업일 구간 안내 (예: 6/27 04:00 ~ 6/28 04:00) */
      rangeLabel: string;
      /** 당일 접수 주문 수 (created_at · 영업일) */
      orderCount: number;
      /** 결제완료(completed_at) 매출 합계 · 영업일 */
      totalSales: number;
      /** 결제 이벤트 수 — 테이블 세션당 1 */
      completedCount: number;
      cancelledCount: number;
      yesterdaySales: number | null;
      yesterdayOrderCount: number | null;
    }
  | { ok: false; message: string };

/** @deprecated 플랫폼·레거시 — 점주 UI는 영업일(`getTenantCurrentBusinessDayBounds`) 사용 */
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

/** 점주 홈 — **이번 영업일** 매출·주문 (결제·접수 이원). */
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

  const [todayBounds, yesterdayBounds] = await Promise.all([
    getTenantCurrentBusinessDayBounds(slug),
    getTenantPreviousBusinessDayBounds(slug),
  ]);
  const { businessDayKey: dateKey, dateLabel, rangeLabel, sinceIso, untilIso, cutoff } = todayBounds;
  const { sinceIso: ySinceIso, untilIso: yUntilIso } = yesterdayBounds;

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
      rangeLabel,
      orderCount: rpc.today.order_count,
      totalSales: rpc.today.total_sales,
      completedCount: rpc.today.completed_count,
      cancelledCount: rpc.today.cancelled_count,
      yesterdaySales: rpc.yesterday.total_sales,
      yesterdayOrderCount: rpc.yesterday.order_count,
    };
  }

  // RPC 미적용 DB — 행 스캔 fallback (매출·결제건수는 completed_at 우선, 분석탭과 동일)
  const [{ data, error }, { data: todayPaidRows }, { data: yPaidRows }] = await Promise.all([
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("status")
        .eq("tenant_slug", slug)
        .gte("created_at", sinceIso)
        .lt("created_at", untilIso),
    ),
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("id, total_price, table_session_id, completed_at, created_at")
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .or(
          `and(completed_at.gte.${sinceIso},completed_at.lt.${untilIso}),` +
            `and(completed_at.is.null,created_at.gte.${sinceIso},created_at.lt.${untilIso})`,
        ),
    ),
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("id, total_price, table_session_id, completed_at, created_at, status")
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .or(
          `and(completed_at.gte.${ySinceIso},completed_at.lt.${yUntilIso}),` +
            `and(completed_at.is.null,created_at.gte.${ySinceIso},created_at.lt.${yUntilIso})`,
        ),
    ),
  ]);

  if (error) {
    return { ok: false, message: error.message ?? "오늘 주문 집계를 불러오지 못했습니다." };
  }

  let orderCount = 0;
  let cancelledCount = 0;
  for (const row of data ?? []) {
    orderCount += 1;
    const status = typeof row.status === "string" ? row.status : "";
    if (status === "cancelled") cancelledCount += 1;
  }

  let totalSales = 0;
  const paidRows = (todayPaidRows as Record<string, unknown>[] | null) ?? [];
  for (const row of paidRows) {
    totalSales += parsePrice(row.total_price);
  }
  const completedCount = countPaymentEventsFromOrderRows(paidRows);

  let yesterdaySales: number | null = null;
  let yesterdayOrderCount: number | null = null;
  const yPaid = (yPaidRows as Record<string, unknown>[] | null) ?? [];
  if (yPaid.length > 0) {
    yesterdaySales = 0;
    for (const row of yPaid) {
      yesterdaySales += parsePrice(row.total_price);
    }
  }

  const { data: yCreatedRows } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("status")
      .eq("tenant_slug", slug)
      .gte("created_at", ySinceIso)
      .lt("created_at", yUntilIso),
  );
  if (yCreatedRows && yCreatedRows.length > 0) {
    yesterdayOrderCount = yCreatedRows.length;
  }

  return {
    ok: true,
    dateKey,
    dateLabel,
    rangeLabel,
    orderCount,
    totalSales,
    completedCount,
    cancelledCount,
    yesterdaySales,
    yesterdayOrderCount,
  };
}

function buildDailyKeysFromBounds(
  sinceIso: string,
  untilIso: string,
  cutoff: string,
): { key: string; label: string; fullLabel: string }[] {
  return buildBusinessDayChartKeys(sinceIso, untilIso, cutoff);
}

export type MerchantAnalyticsRequest =
  | { kind: "period"; days: MerchantAnalyticsPeriod }
  | { kind: "range"; from: string; to: string } // YYYY-MM-DD KST
  | { kind: "month" }; // 이번 달 (KST 1일~오늘)

export type MerchantAnalyticsTimeBounds =
  | { ok: true; sinceIso: string; untilIso: string; periodLabel: string }
  | { ok: false; message: string };

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

  const bounds = await resolveTenantAnalyticsTimeBounds(slug, req);
  if (!bounds.ok) return { ok: false, message: bounds.message };

  const { sinceIso, untilIso, cutoff } = bounds;
  const sinceMs = Date.parse(sinceIso);
  const untilMs = Date.parse(untilIso);
  const duration = untilMs - sinceMs;
  const prevUntilIso = sinceIso;
  const prevSinceIso = new Date(sinceMs - duration).toISOString();

  const days =
    req.kind === "period"
      ? req.days
      : Math.max(1, buildBusinessDayChartKeys(sinceIso, untilIso, cutoff).length);

  const bundle = await fetchMerchantAnalyticsBundleRpc(
    client,
    slug,
    sinceIso,
    untilIso,
    prevSinceIso,
    prevUntilIso,
    MAX_ORDERS,
    600,
    12,
    cutoff,
  );

  let core = bundle?.current ?? null;
  let prevCore = bundle?.previous ?? null;
  let topMenusRpc: { menuId: string; name: string; qty: number }[] | null = null;

  if (bundle) {
    topMenusRpc = await resolveTopMenuNames(client, slug, bundle.top_menus);
  } else {
    const [coreRpc, prevCoreRpc, topMenusFallback] = await Promise.all([
      fetchMerchantAnalyticsCoreRpc(client, slug, sinceIso, untilIso, MAX_ORDERS, cutoff),
      fetchMerchantAnalyticsCoreRpc(client, slug, prevSinceIso, prevUntilIso, MAX_ORDERS, cutoff),
      fetchTopMenusForAnalytics(client, slug, sinceIso, untilIso),
    ]);
    core = coreRpc;
    prevCore = prevCoreRpc;
    topMenusRpc = topMenusFallback;
  }

  if (core) {
    const dailyKeys = buildDailyKeysFromBounds(sinceIso, untilIso, cutoff);
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

    const prevDailyKeys = buildDailyKeysFromBounds(prevSinceIso, prevUntilIso, cutoff);
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
  const buildMainQuery = (withCancelReason: boolean, withTableSession: boolean, withCompletedAt: boolean) => {
    const base = withCancelReason
      ? withTableSession
        ? "created_at, total_price, status, items, cancel_reason, table_session_id, id"
        : "created_at, total_price, status, items, cancel_reason, id"
      : withTableSession
        ? "created_at, total_price, status, items, table_session_id, id"
        : "created_at, total_price, status, items, id";
    const cols = withCompletedAt ? `${base}, completed_at` : base;
    return client
      .from("orders")
      .select(cols)
      .eq("tenant_slug", slug)
      .gte("created_at", sinceIso)
      .lt("created_at", untilIso)
      .order("created_at", { ascending: false })
      .limit(MAX_ORDERS);
  };

  let mainResult = await withSupabaseReadRetry(() => buildMainQuery(true, true, true));
  if (
    mainResult.error &&
    /table_session_id|column.*does not exist/i.test(mainResult.error.message ?? "")
  ) {
    mainResult = await withSupabaseReadRetry(() => buildMainQuery(true, false, true));
  }
  if (
    mainResult.error &&
    /cancel_reason|column.*does not exist/i.test(mainResult.error.message ?? "")
  ) {
    mainResult = await withSupabaseReadRetry(() => buildMainQuery(false, true, true));
    if (
      mainResult.error &&
      /table_session_id|column.*does not exist/i.test(mainResult.error.message ?? "")
    ) {
      mainResult = await withSupabaseReadRetry(() => buildMainQuery(false, false, true));
    }
  }
  if (
    mainResult.error &&
    /completed_at|column.*does not exist/i.test(mainResult.error.message ?? "")
  ) {
    mainResult = await withSupabaseReadRetry(() => buildMainQuery(true, true, false));
    if (
      mainResult.error &&
      /table_session_id|column.*does not exist/i.test(mainResult.error.message ?? "")
    ) {
      mainResult = await withSupabaseReadRetry(() => buildMainQuery(true, false, false));
    }
  }

  const { data: paidRowsRaw } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("id, total_price, table_session_id, completed_at, created_at, items, status")
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .or(
        `and(completed_at.gte.${sinceIso},completed_at.lt.${untilIso}),` +
          `and(completed_at.is.null,created_at.gte.${sinceIso},created_at.lt.${untilIso})`,
      ),
  );

  const { data: rawData, error } = mainResult;

  const [{ data: prevData }, { data: prevPaidRowsRaw }] = await Promise.all([
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("created_at, total_price, status")
        .eq("tenant_slug", slug)
        .gte("created_at", prevSinceIso)
        .lt("created_at", prevUntilIso)
        .limit(MAX_ORDERS),
    ),
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("total_price, completed_at, created_at")
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .or(
          `and(completed_at.gte.${prevSinceIso},completed_at.lt.${prevUntilIso}),` +
            `and(completed_at.is.null,created_at.gte.${prevSinceIso},created_at.lt.${prevUntilIso})`,
        ),
    ),
  ]);

  // unknown[] 캐스트: cancel_reason 유무에 따라 타입이 달라질 수 있음
  const data = (rawData as unknown[]) ?? [];

  if (error) {
    return { ok: false, message: error.message ?? "주문 데이터를 불러오지 못했습니다." };
  }

  const dailyKeys = buildDailyKeysFromBounds(sinceIso, untilIso, cutoff);
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
  let cancelledCount = 0;
  const paidRows = (paidRowsRaw as Record<string, unknown>[] | null) ?? [];

  for (const rawRow of data) {
    const row = rawRow as Record<string, unknown>;
    const created = typeof row.created_at === "string" ? row.created_at : "";
    const status = typeof row.status === "string" ? row.status : "";

    if (status === "cancelled") {
      cancelledCount += 1;
      const rawReason = row.cancel_reason;
      const reason =
        typeof rawReason === "string" && rawReason.trim() ? rawReason.trim() : "other";
      reasonQty.set(reason, (reasonQty.get(reason) ?? 0) + 1);
    }

    const bizKey = created ? businessDayKeyFromIso(created, cutoff) : null;
    if (bizKey && dailyMap.has(bizKey)) {
      dailyMap.get(bizKey)!.orders += 1;
    }

    const hour = created ? kstHour(created) : null;
    if (hour != null) hourly[hour]!.orders += 1;

    const dow = created ? kstWeekday(created) : null;
    if (dow != null) dowMap.get(dow)!.orders += 1;
  }

  let totalSales = 0;
  for (const row of paidRows) {
    const price = parsePrice(row.total_price);
    totalSales += price;
    const paidIso =
      typeof row.completed_at === "string" && row.completed_at
        ? row.completed_at
        : typeof row.created_at === "string"
          ? row.created_at
          : "";
    const bizKey = paidIso ? businessDayKeyFromIso(paidIso, cutoff) : null;
    if (bizKey && dailyMap.has(bizKey)) {
      dailyMap.get(bizKey)!.sales += price;
    }
    const hour = paidIso ? kstHour(paidIso) : null;
    if (hour != null) hourly[hour]!.sales += price;
    const dow = paidIso ? kstWeekday(paidIso) : null;
    if (dow != null) dowMap.get(dow)!.sales += price;

    const itemsRaw = row.items;
    if (Array.isArray(itemsRaw)) {
      for (const elem of itemsRaw) {
        const line = parseOrderLine(elem);
        if (!line) continue;
        menuQty.set(line.id, (menuQty.get(line.id) ?? 0) + line.qty);
      }
    }
  }

  const completedCount = countPaymentEventsFromOrderRows(paidRows);

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
  const prevDailyKeys = buildDailyKeysFromBounds(prevSinceIso, prevUntilIso, cutoff);
  const prevDailyMap = new Map(prevDailyKeys.map((d) => [d.key, { orders: 0, sales: 0 }]));
  for (const row of prevData ?? []) {
    const created = typeof row.created_at === "string" ? row.created_at : "";
    const bizKey = created ? businessDayKeyFromIso(created, cutoff) : null;
    if (bizKey && prevDailyMap.has(bizKey)) {
      prevDailyMap.get(bizKey)!.orders += 1;
    }
  }
  for (const row of (prevPaidRowsRaw as Record<string, unknown>[] | null) ?? []) {
    const price = parsePrice(row.total_price);
    const paidIso =
      typeof row.completed_at === "string" && row.completed_at
        ? row.completed_at
        : typeof row.created_at === "string"
          ? row.created_at
          : "";
    const bizKey = paidIso ? businessDayKeyFromIso(paidIso, cutoff) : null;
    if (bizKey && prevDailyMap.has(bizKey)) {
      prevDailyMap.get(bizKey)!.sales += price;
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
      .select("items, completed_at, created_at")
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .or(
        `and(completed_at.gte.${sinceIso},completed_at.lt.${untilIso}),` +
          `and(completed_at.is.null,created_at.gte.${sinceIso},created_at.lt.${untilIso})`,
      )
      .order("completed_at", { ascending: false })
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
