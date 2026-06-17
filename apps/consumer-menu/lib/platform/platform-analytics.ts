import "server-only";

import { buildOnboardingFunnel, type OnboardingFunnelSnapshot } from "@/lib/platform/platform-onboarding-funnel";
import type { PlatformHealthGrade } from "@/lib/platform/platform-health-score";
import { listPlatformStores } from "@/lib/platform/list-platform-stores";
import { getKstCalendarDayBounds } from "@/lib/orders/merchant-analytics";
import { getTenantBranding } from "@/lib/tenant/tenant-branding";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

const KST = "Asia/Seoul";

function parsePrice(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export type PlatformAlertSeverity = "urgent" | "watch";

export type PlatformAlert = {
  kind: "cancel_spike" | "inactive_store" | "onboarding_gap" | "off_hours_orders";
  severity: PlatformAlertSeverity;
  tenantSlug: string;
  message: string;
};

export type PlatformStoreRankingRow = {
  tenantSlug: string;
  displayName: string;
  todaySales: number;
  todayOrders: number;
};

export type PlatformSalesTrendDay = {
  label: string;
  sales: number;
  isToday: boolean;
};

export type PlatformHealthMetrics = {
  totalStores: number;
  activeStores7d: number;
  orderStores30d: number;
  churnRisk14d: number;
  operatingToday: number;
};

export type PlatformDashboardSnapshot =
  | {
      ok: true;
      dateLabel: string;
      totalSalesToday: number;
      totalOrdersToday: number;
      health: PlatformHealthMetrics;
      newStoresThisMonth: number;
      avgSalesPerActiveStore: number;
      rankings: PlatformStoreRankingRow[];
      alerts: PlatformAlert[];
      funnel: OnboardingFunnelSnapshot;
      watchStores: { tenantSlug: string; displayName: string; healthScore: number; healthGrade: PlatformHealthGrade }[];
      salesTrend7d: PlatformSalesTrendDay[];
    }
  | { ok: false; message: string };

function monthStartKstKey(nowMs = Date.now()): string {
  const today = new Date(nowMs).toLocaleDateString("en-CA", { timeZone: KST });
  const [y, mo] = today.split("-");
  return `${y}-${mo}-01`;
}

function isOffHoursKst(iso: string): boolean {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  const h = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: KST, hour: "numeric", hour12: false }).format(
      new Date(t),
    ),
  );
  return h >= 2 && h < 5;
}

export async function getPlatformDashboardSnapshot(): Promise<PlatformDashboardSnapshot> {
  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "Supabase 서버 설정(SERVICE_ROLE)이 없습니다." };
  }

  const { dateLabel, sinceIso, untilIso } = getKstCalendarDayBounds();
  const monthStart = monthStartKstKey();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [storesRes, ordersRes] = await Promise.all([
    listPlatformStores(),
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("tenant_slug, total_price, status, created_at")
        .gte("created_at", sinceIso)
        .lt("created_at", untilIso),
    ),
  ]);

  if (!storesRes.ok) {
    return { ok: false, message: storesRes.message };
  }
  if (ordersRes.error) {
    return { ok: false, message: ordersRes.error.message ?? "오늘 주문을 불러오지 못했습니다." };
  }

  const stores = storesRes.stores;
  const perStoreToday = new Map<string, { sales: number; orders: number; cancelled: number; offHours: number }>();

  for (const s of stores) {
    perStoreToday.set(s.tenantSlug, { sales: 0, orders: 0, cancelled: 0, offHours: 0 });
  }

  for (const row of ordersRes.data ?? []) {
    const slug = typeof row.tenant_slug === "string" ? row.tenant_slug.trim() : "";
    if (!slug) continue;
    const bucket = perStoreToday.get(slug) ?? { sales: 0, orders: 0, cancelled: 0, offHours: 0 };
    bucket.orders += 1;
    const status = typeof row.status === "string" ? row.status : "";
    if (status === "cancelled") bucket.cancelled += 1;
    else bucket.sales += parsePrice(row.total_price);
    const created = typeof row.created_at === "string" ? row.created_at : "";
    if (created && isOffHoursKst(created)) bucket.offHours += 1;
    perStoreToday.set(slug, bucket);
  }

  let totalSalesToday = 0;
  let totalOrdersToday = 0;
  let operatingToday = 0;

  const rankings: PlatformStoreRankingRow[] = [];
  for (const [slug, m] of perStoreToday) {
    totalSalesToday += m.sales;
    totalOrdersToday += m.orders;
    if (m.orders > 0) operatingToday += 1;
    if (m.orders > 0 || m.sales > 0) {
      rankings.push({
        tenantSlug: slug,
        displayName: getTenantBranding(slug).displayName,
        todaySales: m.sales,
        todayOrders: m.orders,
      });
    }
  }

  rankings.sort((a, b) => b.todaySales - a.todaySales || b.todayOrders - a.todayOrders);

  const activeStores7d = stores.filter((s) => s.ordersLast7d > 0).length;
  const orderStores30d = stores.filter((s) => s.ordersLast30d > 0).length;
  const churnRisk14d = stores.filter(
    (s) =>
      s.approvedMemberCount > 0 &&
      s.menuCount > 0 &&
      (!s.lastOrderAt || s.lastOrderAt < twoWeeksAgo),
  ).length;

  const newStoresThisMonth = stores.filter(
    (s) => s.firstMemberAt && s.firstMemberAt.slice(0, 10) >= monthStart,
  ).length;

  const avgSalesPerActiveStore =
    operatingToday > 0 ? Math.round(totalSalesToday / operatingToday) : 0;

  const alerts: PlatformAlert[] = [];

  for (const [slug, m] of perStoreToday) {
    if (m.orders >= 3 && m.cancelled / m.orders >= 0.3) {
      alerts.push({
        kind: "cancel_spike",
        severity: "urgent",
        tenantSlug: slug,
        message: `${getTenantBranding(slug).displayName} — 오늘 취소율 ${Math.round((m.cancelled / m.orders) * 100)}%`,
      });
    }
    if (m.offHours >= 3) {
      alerts.push({
        kind: "off_hours_orders",
        severity: "watch",
        tenantSlug: slug,
        message: `${getTenantBranding(slug).displayName} — 새벽(02~05시) 주문 ${m.offHours}건`,
      });
    }
  }

  for (const s of stores) {
    if (s.atRisk && (!s.lastOrderAt || s.lastOrderAt < twoWeeksAgo)) {
      alerts.push({
        kind: "inactive_store",
        severity: "watch",
        tenantSlug: s.tenantSlug,
        message: `${s.displayName} — 14일 이상 주문 없음 (이탈 위험)`,
      });
    }
    const signedDaysAgo =
      s.firstMemberAt && Number.isFinite(Date.parse(s.firstMemberAt))
        ? (Date.now() - Date.parse(s.firstMemberAt)) / (24 * 60 * 60 * 1000)
        : 0;
    if (s.approvedMemberCount > 0 && s.menuCount === 0 && signedDaysAgo >= 7) {
      alerts.push({
        kind: "onboarding_gap",
        severity: "urgent",
        tenantSlug: s.tenantSlug,
        message: `${s.displayName} — 가입 후 7일+ 메뉴 미등록`,
      });
    }
  }

  const severityOrder = { urgent: 0, watch: 1 };
  alerts.sort(
    (a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity] ||
      a.tenantSlug.localeCompare(b.tenantSlug),
  );

  const watchStores = stores
    .filter((s) => s.health.score < 60 || s.atRisk)
    .sort((a, b) => a.health.score - b.health.score)
    .slice(0, 5)
    .map((s) => ({
      tenantSlug: s.tenantSlug,
      displayName: s.displayName,
      healthScore: s.health.score,
      healthGrade: s.health.grade,
    }));

  const trendKeys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    trendKeys.push(d.toLocaleDateString("en-CA", { timeZone: KST }));
  }
  const trendSinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const trendRes = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("total_price, status, created_at")
      .gte("created_at", trendSinceIso)
      .neq("status", "cancelled"),
  );
  const salesByDay = new Map<string, number>();
  for (const key of trendKeys) salesByDay.set(key, 0);
  if (!trendRes.error) {
    for (const row of trendRes.data ?? []) {
      const created = typeof row.created_at === "string" ? row.created_at : "";
      if (!created) continue;
      const key = new Date(created).toLocaleDateString("en-CA", { timeZone: KST });
      if (!salesByDay.has(key)) continue;
      salesByDay.set(key, (salesByDay.get(key) ?? 0) + parsePrice(row.total_price));
    }
  }
  const todayKey = trendKeys[trendKeys.length - 1] ?? "";
  const salesTrend7d: PlatformSalesTrendDay[] = trendKeys.map((key) => {
    const [, mo, da] = key.split("-");
    const isToday = key === todayKey;
    return {
      label: isToday ? "오늘" : `${Number(mo)}/${Number(da)}`,
      sales: salesByDay.get(key) ?? 0,
      isToday,
    };
  });

  return {
    ok: true,
    dateLabel,
    totalSalesToday,
    totalOrdersToday,
    health: {
      totalStores: stores.length,
      activeStores7d,
      orderStores30d,
      churnRisk14d,
      operatingToday,
    },
    newStoresThisMonth,
    avgSalesPerActiveStore,
    rankings: rankings.slice(0, 10),
    alerts: alerts.slice(0, 12),
    funnel: buildOnboardingFunnel(stores),
    watchStores,
    salesTrend7d,
  };
}
