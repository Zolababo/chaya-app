import "server-only";

import { cache } from "react";

import { getPlatformStoreSummary } from "@/lib/platform/list-platform-stores";
import { merchantAuditActionLabel } from "@/lib/merchant/list-merchant-audit-events";
import { parseOrderLineSummaries } from "@/lib/orders/format-order-line-summary";
import { parseOrderNoField } from "@/lib/orders/format-order-no";
import { getMerchantAnalytics, getMerchantTodayKstMetrics } from "@/lib/orders/merchant-analytics";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

export type PlatformStoreRecentOrder = {
  id: string;
  orderNo: number | null;
  createdAt: string;
  status: string;
  totalPrice: number;
  tableNo: string | null;
  lineSummary: string;
};

export type PlatformStoreAuditRow = {
  id: string;
  createdAt: string;
  action: string;
  actionLabel: string;
};

export type PlatformStoreDetailSnapshot =
  | {
      ok: true;
      store: NonNullable<Awaited<ReturnType<typeof getPlatformStoreSummary>>>;
      today: Extract<Awaited<ReturnType<typeof getMerchantTodayKstMetrics>>, { ok: true }>;
      monthAnalytics: Extract<Awaited<ReturnType<typeof getMerchantAnalytics>>, { ok: true }> | null;
      recentOrders: PlatformStoreRecentOrder[];
      auditTrail: PlatformStoreAuditRow[];
    }
  | { ok: false; message: string };

function lineSummary(items: unknown): string {
  const lines = parseOrderLineSummaries(items);
  if (lines.length === 0) return "—";
  const head = lines.slice(0, 2).map((l) => `${l.name}×${l.quantity}`);
  return lines.length > 2 ? `${head.join(", ")} 외 ${lines.length - 2}` : head.join(", ");
}

export const getPlatformStoreDetail = cache(async function getPlatformStoreDetail(
  tenantSlug: string,
): Promise<PlatformStoreDetailSnapshot> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "매장을 찾을 수 없습니다." };

  const [store, today, monthAnalytics] = await Promise.all([
    getPlatformStoreSummary(slug),
    getMerchantTodayKstMetrics(slug),
    getMerchantAnalytics(slug, { kind: "month" }).catch(() => ({ ok: false as const, message: "" })),
  ]);

  if (!store) return { ok: false, message: "등록된 매장이 없습니다." };
  if (!today.ok) return { ok: false, message: today.message };

  const client = createServiceSupabase();
  let recentOrders: PlatformStoreRecentOrder[] = [];
  let auditTrail: PlatformStoreAuditRow[] = [];

  if (client) {
    const [ordersRes, auditRes] = await Promise.all([
      withSupabaseReadRetry(() =>
        client
          .from("orders")
          .select("id, order_no, created_at, status, total_price, table_no, items")
          .eq("tenant_slug", slug)
          .order("created_at", { ascending: false })
          .limit(8),
      ),
      withSupabaseReadRetry(() =>
        client
          .from("merchant_audit_events")
          .select("id, created_at, action")
          .eq("tenant_slug", slug)
          .order("created_at", { ascending: false })
          .limit(6),
      ),
    ]);

    recentOrders = (ordersRes.data ?? [])
      .map((raw) => {
        const r = raw as Record<string, unknown>;
        const id = typeof r.id === "string" ? r.id : "";
        const createdAt = typeof r.created_at === "string" ? r.created_at : "";
        const status = typeof r.status === "string" ? r.status : "";
        const total = typeof r.total_price === "number" ? r.total_price : Number(r.total_price);
        if (!id || !createdAt) return null;
        return {
          id,
          orderNo: parseOrderNoField(r.order_no),
          createdAt,
          status,
          totalPrice: Number.isFinite(total) ? total : 0,
          tableNo: typeof r.table_no === "string" ? r.table_no : null,
          lineSummary: lineSummary(r.items),
        };
      })
      .filter((r): r is PlatformStoreRecentOrder => r !== null);

    auditTrail = (auditRes.data ?? [])
      .map((raw) => {
        const r = raw as Record<string, unknown>;
        const id = typeof r.id === "string" ? r.id : "";
        const createdAt = typeof r.created_at === "string" ? r.created_at : "";
        const action = typeof r.action === "string" ? r.action : "";
        if (!id) return null;
        return {
          id,
          createdAt,
          action,
          actionLabel: merchantAuditActionLabel(action),
        };
      })
      .filter((r): r is PlatformStoreAuditRow => r !== null);
  }

  return {
    ok: true,
    store,
    today,
    monthAnalytics: monthAnalytics.ok ? monthAnalytics : null,
    recentOrders,
    auditTrail,
  };
});
