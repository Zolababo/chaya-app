import type { MerchantOrdersTab } from "@/lib/merchant/merchant-orders-tab";
import type { MerchantOrderRow } from "@/lib/orders/list-orders-for-merchant";
import type { MerchantHomeOpsCounts } from "@/lib/orders/merchant-home-ops";
import type { MerchantTodayKstMetrics } from "@/lib/orders/merchant-analytics";
import type { ChayaMenuRow } from "@/lib/menus/types";

import type { MerchantAnalyticsSnapshot } from "@/lib/orders/merchant-analytics";

export type MerchantLiveAnalyticsPayload = {
  ok: true;
  snapshot: Extract<MerchantAnalyticsSnapshot, { ok: true }>;
};

export type MerchantLiveAnalyticsError = {
  ok: false;
  message: string;
};

export function parseMerchantLiveAnalytics(
  json: unknown,
): MerchantLiveAnalyticsPayload | MerchantLiveAnalyticsError | null {
  if (!json || typeof json !== "object") return null;
  const o = json as { ok?: unknown; snapshot?: unknown; message?: unknown };
  if (o.ok === false && typeof o.message === "string") return { ok: false, message: o.message };
  if (o.ok !== true || !o.snapshot || typeof o.snapshot !== "object") return null;
  const s = o.snapshot as { ok?: unknown };
  if (s.ok !== true) return null;
  return { ok: true, snapshot: o.snapshot as MerchantLiveAnalyticsPayload["snapshot"] };
}

export type MerchantLiveMenusPayload = {
  ok: true;
  items: ChayaMenuRow[];
};

export type MerchantLiveMenusError = {
  ok: false;
  message: string;
};

export type MerchantLiveOrdersPayload = {
  ok: true;
  tab: MerchantOrdersTab;
  rows: MerchantOrderRow[];
  ops: {
    pending: number;
    cooking: number;
    ready: number;
    todayPaid: number;
    todayCancelled: number;
    delayedCount: number;
    delayedOrderIds: string[];
  };
};

export type MerchantLiveOrdersError = {
  ok: false;
  message: string;
};

export type MerchantLiveDashboardPayload = {
  ok: true;
  canManageMenus: boolean;
  ops: MerchantHomeOpsCounts;
  metrics: MerchantTodayKstMetrics;
  menuItems: ChayaMenuRow[];
};

export type MerchantLiveDashboardError = {
  ok: false;
  message: string;
};

export function parseMerchantLiveMenus(
  json: unknown,
): MerchantLiveMenusPayload | MerchantLiveMenusError | null {
  if (!json || typeof json !== "object") return null;
  const o = json as { ok?: unknown; items?: unknown; message?: unknown };
  if (o.ok === false && typeof o.message === "string") return { ok: false, message: o.message };
  if (o.ok === true && Array.isArray(o.items)) return { ok: true, items: o.items as ChayaMenuRow[] };
  return null;
}

export function parseMerchantLiveOrders(
  json: unknown,
): MerchantLiveOrdersPayload | MerchantLiveOrdersError | null {
  if (!json || typeof json !== "object") return null;
  const o = json as {
    ok?: unknown;
    tab?: unknown;
    rows?: unknown;
    ops?: unknown;
    message?: unknown;
  };
  if (o.ok === false && typeof o.message === "string") return { ok: false, message: o.message };
  if (o.ok !== true || !Array.isArray(o.rows) || !o.ops || typeof o.ops !== "object") return null;
  const ops = o.ops as MerchantLiveOrdersPayload["ops"];
  if (
    typeof ops.pending !== "number" ||
    typeof ops.cooking !== "number" ||
    typeof ops.ready !== "number"
  ) {
    return null;
  }
  return {
    ok: true,
    tab: o.tab as MerchantOrdersTab,
    rows: o.rows as MerchantOrderRow[],
    ops,
  };
}

export function parseMerchantLiveDashboard(
  json: unknown,
): MerchantLiveDashboardPayload | MerchantLiveDashboardError | null {
  if (!json || typeof json !== "object") return null;
  const o = json as {
    ok?: unknown;
    message?: unknown;
    canManageMenus?: unknown;
    ops?: unknown;
    metrics?: unknown;
    menuItems?: unknown;
  };
  if (o.ok === false && typeof o.message === "string") return { ok: false, message: o.message };
  if (o.ok !== true || !o.ops || typeof o.ops !== "object") return null;
  if (!o.metrics || typeof o.metrics !== "object") return null;
  if (!Array.isArray(o.menuItems)) return null;
  return {
    ok: true,
    canManageMenus: o.canManageMenus === true,
    ops: o.ops as MerchantHomeOpsCounts,
    metrics: o.metrics as MerchantTodayKstMetrics,
    menuItems: o.menuItems as ChayaMenuRow[],
  };
}
