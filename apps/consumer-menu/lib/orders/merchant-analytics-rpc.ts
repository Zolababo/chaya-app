import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

export type MerchantAnalyticsRpcCore = {
  totals: {
    order_count: number;
    total_sales: number;
    completed_count: number;
    cancelled_count: number;
  };
  daily: { day_key: string; orders: number; sales: number }[];
  hourly: { hour: number; orders: number; sales: number }[];
  by_dow: { dow: number; orders: number; sales: number }[];
  cancel_reasons: { reason: string; cnt: number }[];
};

function parseMerchantAnalyticsCoreFromRaw(data: unknown): MerchantAnalyticsRpcCore | null {
  if (data == null || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  const totalsRaw = raw.totals;
  if (!totalsRaw || typeof totalsRaw !== "object") return null;
  const t = totalsRaw as Record<string, unknown>;

  return {
    totals: {
      order_count: Number(t.order_count) || 0,
      total_sales: Number(t.total_sales) || 0,
      completed_count: Number(t.completed_count) || 0,
      cancelled_count: Number(t.cancelled_count) || 0,
    },
    daily: parseDaily(raw.daily),
    hourly: parseHourly(raw.hourly),
    by_dow: parseDow(raw.by_dow),
    cancel_reasons: parseCancelReasons(raw.cancel_reasons),
  };
}

export async function fetchMerchantAnalyticsCoreRpc(
  client: SupabaseClient,
  tenantSlug: string,
  sinceIso: string,
  untilIso: string,
  limit = 2500,
): Promise<MerchantAnalyticsRpcCore | null> {
  const { data, error } = await withSupabaseReadRetry(() =>
    client.rpc("merchant_analytics_core", {
      p_tenant_slug: tenantSlug,
      p_since: sinceIso,
      p_until: untilIso,
      p_limit: limit,
    }),
  );

  if (error) return null;
  return parseMerchantAnalyticsCoreFromRaw(data);
}

export type MerchantAnalyticsBundleRpc = {
  current: MerchantAnalyticsRpcCore;
  previous: MerchantAnalyticsRpcCore | null;
  top_menus: MerchantAnalyticsTopMenuRow[];
};

function parseTopMenuRows(v: unknown): MerchantAnalyticsTopMenuRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const menu_id = typeof r.menu_id === "string" ? r.menu_id.trim() : "";
      if (!menu_id) return null;
      return { menu_id, qty: Number(r.qty) || 0 };
    })
    .filter((x): x is MerchantAnalyticsTopMenuRow => x != null);
}

/** current + previous + top_menus — Supabase RPC 1회 (마이그레이션 미적용 시 null) */
export async function fetchMerchantAnalyticsBundleRpc(
  client: SupabaseClient,
  tenantSlug: string,
  sinceIso: string,
  untilIso: string,
  prevSinceIso: string,
  prevUntilIso: string,
  coreLimit = 2500,
  topOrderLimit = 600,
  topN = 12,
): Promise<MerchantAnalyticsBundleRpc | null> {
  const { data, error } = await withSupabaseReadRetry(() =>
    client.rpc("merchant_analytics_bundle", {
      p_tenant_slug: tenantSlug,
      p_since: sinceIso,
      p_until: untilIso,
      p_prev_since: prevSinceIso,
      p_prev_until: prevUntilIso,
      p_core_limit: coreLimit,
      p_top_order_limit: topOrderLimit,
      p_top_n: topN,
    }),
  );

  if (error) return null;

  const raw = data as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") return null;

  const current = parseMerchantAnalyticsCoreFromRaw(raw.current);
  if (!current) return null;

  const previous = parseMerchantAnalyticsCoreFromRaw(raw.previous);
  const top_menus = parseTopMenuRows(raw.top_menus);

  return { current, previous, top_menus };
}

function parseDaily(v: unknown): MerchantAnalyticsRpcCore["daily"] {
  if (!Array.isArray(v)) return [];
  return v
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const day_key = typeof r.day_key === "string" ? r.day_key : "";
      if (!day_key) return null;
      return { day_key, orders: Number(r.orders) || 0, sales: Number(r.sales) || 0 };
    })
    .filter((x): x is MerchantAnalyticsRpcCore["daily"][number] => x != null);
}

function parseHourly(v: unknown): MerchantAnalyticsRpcCore["hourly"] {
  if (!Array.isArray(v)) return [];
  return v
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const hour = Number(r.hour);
      if (!Number.isFinite(hour)) return null;
      return { hour, orders: Number(r.orders) || 0, sales: Number(r.sales) || 0 };
    })
    .filter((x): x is MerchantAnalyticsRpcCore["hourly"][number] => x != null);
}

function parseDow(v: unknown): MerchantAnalyticsRpcCore["by_dow"] {
  if (!Array.isArray(v)) return [];
  return v
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const dow = Number(r.dow);
      if (!Number.isFinite(dow)) return null;
      return { dow, orders: Number(r.orders) || 0, sales: Number(r.sales) || 0 };
    })
    .filter((x): x is MerchantAnalyticsRpcCore["by_dow"][number] => x != null);
}

function parseCancelReasons(v: unknown): MerchantAnalyticsRpcCore["cancel_reasons"] {
  if (!Array.isArray(v)) return [];
  return v
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const reason = typeof r.reason === "string" ? r.reason : "other";
      return { reason, cnt: Number(r.cnt) || 0 };
    })
    .filter((x): x is MerchantAnalyticsRpcCore["cancel_reasons"][number] => x != null);
}

export type MerchantTodayMetricsRpc = {
  today: { order_count: number; total_sales: number; cancelled_count: number };
  yesterday: { order_count: number; total_sales: number };
};

export async function fetchMerchantTodayMetricsRpc(
  client: SupabaseClient,
  tenantSlug: string,
  todaySince: string,
  todayUntil: string,
  yesterdaySince: string,
  yesterdayUntil: string,
): Promise<MerchantTodayMetricsRpc | null> {
  const { data, error } = await withSupabaseReadRetry(() =>
    client.rpc("merchant_today_kst_metrics", {
      p_tenant_slug: tenantSlug,
      p_today_since: todaySince,
      p_today_until: todayUntil,
      p_yesterday_since: yesterdaySince,
      p_yesterday_until: yesterdayUntil,
    }),
  );

  if (error || data == null || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  const todayRaw = raw.today;
  const yesterdayRaw = raw.yesterday;
  if (!todayRaw || typeof todayRaw !== "object") return null;
  if (!yesterdayRaw || typeof yesterdayRaw !== "object") return null;

  const t = todayRaw as Record<string, unknown>;
  const y = yesterdayRaw as Record<string, unknown>;

  return {
    today: {
      order_count: Number(t.order_count) || 0,
      total_sales: Number(t.total_sales) || 0,
      cancelled_count: Number(t.cancelled_count) || 0,
    },
    yesterday: {
      order_count: Number(y.order_count) || 0,
      total_sales: Number(y.total_sales) || 0,
    },
  };
}

export type MerchantAnalyticsTopMenuRow = { menu_id: string; qty: number };

export async function fetchMerchantAnalyticsTopMenusRpc(
  client: SupabaseClient,
  tenantSlug: string,
  sinceIso: string,
  untilIso: string,
  orderLimit = 600,
  topN = 12,
): Promise<MerchantAnalyticsTopMenuRow[] | null> {
  const { data, error } = await withSupabaseReadRetry(() =>
    client.rpc("merchant_analytics_top_menus", {
      p_tenant_slug: tenantSlug,
      p_since: sinceIso,
      p_until: untilIso,
      p_order_limit: orderLimit,
      p_top_n: topN,
    }),
  );

  if (error || data == null) return null;
  if (!Array.isArray(data)) return null;

  return data
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const menu_id = typeof r.menu_id === "string" ? r.menu_id.trim() : "";
      if (!menu_id) return null;
      return { menu_id, qty: Number(r.qty) || 0 };
    })
    .filter((x): x is MerchantAnalyticsTopMenuRow => x != null);
}
