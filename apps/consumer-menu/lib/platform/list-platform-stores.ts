import "server-only";

import { cache } from "react";

import { computeStoreHealth, type StoreHealthResult } from "@/lib/platform/platform-health-score";
import { getTenantBranding } from "@/lib/tenant/tenant-branding";
import { getKstCalendarDayBounds } from "@/lib/orders/merchant-analytics";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

export type PlatformStoreOperatingStatus = "active" | "idle" | "new" | "setup";

export type PlatformStoreSummary = {
  tenantSlug: string;
  displayName: string;
  operatingStatus: PlatformStoreOperatingStatus;
  memberCount: number;
  approvedMemberCount: number;
  pendingApprovalCount: number;
  menuCount: number;
  menusWithPhoto: number;
  menusSoldOut: number;
  activeTableCount: number;
  todayOrderCount: number;
  todaySales: number;
  ordersLast7d: number;
  ordersLast30d: number;
  lastOrderAt: string | null;
  lastMerchantActivityAt: string | null;
  firstMemberAt: string | null;
  hasOrderEver: boolean;
  onboardingPercent: number;
  onboardingFlags: string[];
  atRisk: boolean;
  health: StoreHealthResult;
};

export type PlatformStoreListResult =
  | { ok: true; stores: PlatformStoreSummary[] }
  | { ok: false; message: string };

function parsePrice(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function computeOnboarding(input: {
  menuCount: number;
  activeTableCount: number;
  approvedMemberCount: number;
  hasOrderEver: boolean;
}): { percent: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;
  if (input.approvedMemberCount > 0) score += 25;
  else flags.push("점주 승인 대기");
  if (input.menuCount > 0) score += 35;
  else flags.push("메뉴 0개");
  if (input.activeTableCount > 0) score += 25;
  else flags.push("QR·테이블 미설정");
  if (input.hasOrderEver) score += 15;
  else flags.push("테스트 주문 없음");
  return { percent: score, flags };
}

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

export const listPlatformStores = cache(async function listPlatformStores(): Promise<PlatformStoreListResult> {
  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "Supabase 서버 설정(SERVICE_ROLE)이 없습니다." };
  }

  const { sinceIso, untilIso } = getKstCalendarDayBounds();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [membersRes, menusRes, tablesRes, todayOrdersRes, recentOrdersRes, auditRes] =
    await Promise.all([
      withSupabaseReadRetry(() =>
        client.from("merchant_tenant_members").select("tenant_slug, approved_at, created_at"),
      ),
      withSupabaseReadRetry(() =>
        client.from("ChayaMenus").select("tenant_slug, imageUrl, is_sold_out"),
      ),
      withSupabaseReadRetry(() =>
        client.from("tenant_tables").select("tenant_slug, is_active"),
      ),
      withSupabaseReadRetry(() =>
        client
          .from("orders")
          .select("tenant_slug, total_price, status")
          .gte("created_at", sinceIso)
          .lt("created_at", untilIso),
      ),
      withSupabaseReadRetry(() =>
        client
          .from("orders")
          .select("tenant_slug, created_at")
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: false })
          .limit(3000),
      ),
      withSupabaseReadRetry(() =>
        client
          .from("merchant_audit_events")
          .select("tenant_slug, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
      ),
    ]);

  if (membersRes.error) {
    return { ok: false, message: membersRes.error.message ?? "멤버 목록 오류" };
  }

  type Bucket = {
    memberCount: number;
    approvedMemberCount: number;
    pendingApprovalCount: number;
    firstMemberAt: string | null;
    menuCount: number;
    menusWithPhoto: number;
    menusSoldOut: number;
    activeTableCount: number;
    todayOrderCount: number;
    todaySales: number;
    ordersLast7d: number;
    ordersLast30d: number;
    lastOrderAt: string | null;
    lastMerchantActivityAt: string | null;
    hasOrderEver: boolean;
  };

  const bySlug = new Map<string, Bucket>();

  function ensure(slug: string): Bucket {
    if (!bySlug.has(slug)) {
      bySlug.set(slug, {
        memberCount: 0,
        approvedMemberCount: 0,
        pendingApprovalCount: 0,
        firstMemberAt: null,
        menuCount: 0,
        menusWithPhoto: 0,
        menusSoldOut: 0,
        activeTableCount: 0,
        todayOrderCount: 0,
        todaySales: 0,
        ordersLast7d: 0,
        ordersLast30d: 0,
        lastOrderAt: null,
        lastMerchantActivityAt: null,
        hasOrderEver: false,
      });
    }
    return bySlug.get(slug)!;
  }

  for (const row of membersRes.data ?? []) {
    const slug = typeof row.tenant_slug === "string" ? row.tenant_slug.trim() : "";
    if (!slug) continue;
    const b = ensure(slug);
    b.memberCount += 1;
    const approved = row.approved_at;
    if (typeof approved === "string" && approved) b.approvedMemberCount += 1;
    else b.pendingApprovalCount += 1;
    const created = typeof row.created_at === "string" ? row.created_at : null;
    if (created && (!b.firstMemberAt || created < b.firstMemberAt)) b.firstMemberAt = created;
  }

  for (const row of menusRes.data ?? []) {
    const slug = typeof row.tenant_slug === "string" ? row.tenant_slug.trim() : "";
    if (!slug) continue;
    const b = ensure(slug);
    b.menuCount += 1;
    const img = row.imageUrl;
    if (typeof img === "string" && img.trim()) b.menusWithPhoto += 1;
    if (row.is_sold_out === true) b.menusSoldOut += 1;
  }

  for (const row of tablesRes.data ?? []) {
    const slug = typeof row.tenant_slug === "string" ? row.tenant_slug.trim() : "";
    if (!slug) continue;
    if (row.is_active === true) ensure(slug).activeTableCount += 1;
  }

  for (const row of todayOrdersRes.data ?? []) {
    const slug = typeof row.tenant_slug === "string" ? row.tenant_slug.trim() : "";
    if (!slug) continue;
    const b = ensure(slug);
    b.todayOrderCount += 1;
    const status = typeof row.status === "string" ? row.status : "";
    if (status !== "cancelled") b.todaySales += parsePrice(row.total_price);
  }

  const lastOrderSeen = new Set<string>();
  for (const row of recentOrdersRes.data ?? []) {
    const slug = typeof row.tenant_slug === "string" ? row.tenant_slug.trim() : "";
    const at = typeof row.created_at === "string" ? row.created_at : "";
    if (!slug || !at) continue;
    const b = ensure(slug);
    b.hasOrderEver = true;
    b.ordersLast30d += 1;
    if (at >= sevenDaysAgo) b.ordersLast7d += 1;
    b.lastMerchantActivityAt = maxIso(b.lastMerchantActivityAt, at);
    if (!lastOrderSeen.has(slug)) {
      lastOrderSeen.add(slug);
      b.lastOrderAt = at;
    }
  }

  for (const row of auditRes.data ?? []) {
    const slug = typeof row.tenant_slug === "string" ? row.tenant_slug.trim() : "";
    const at = typeof row.created_at === "string" ? row.created_at : "";
    if (!slug || !at) continue;
    ensure(slug).lastMerchantActivityAt = maxIso(ensure(slug).lastMerchantActivityAt, at);
  }

  const stores: PlatformStoreSummary[] = [...bySlug.entries()]
    .map(([tenantSlug, b]) => {
      const { percent, flags } = computeOnboarding({
        menuCount: b.menuCount,
        activeTableCount: b.activeTableCount,
        approvedMemberCount: b.approvedMemberCount,
        hasOrderEver: b.hasOrderEver,
      });

      const health = computeStoreHealth({
        menuCount: b.menuCount,
        menusWithPhoto: b.menusWithPhoto,
        ordersLast7d: b.ordersLast7d,
        lastMerchantActivityAt: b.lastMerchantActivityAt,
        activeTableCount: b.activeTableCount,
      });

      let operatingStatus: PlatformStoreOperatingStatus = "idle";
      if (b.todayOrderCount > 0) operatingStatus = "active";
      else if (b.firstMemberAt && b.firstMemberAt >= twoWeeksAgo) operatingStatus = "new";
      else if (percent < 75) operatingStatus = "setup";

      const churnIdle =
        b.approvedMemberCount > 0 &&
        (!b.lastOrderAt || b.lastOrderAt < twoWeeksAgo) &&
        b.menuCount > 0;

      const atRisk =
        health.score < 40 ||
        flags.length >= 2 ||
        churnIdle ||
        (b.menuCount === 0 && b.memberCount > 0);

      return {
        tenantSlug,
        displayName: getTenantBranding(tenantSlug).displayName,
        operatingStatus,
        memberCount: b.memberCount,
        approvedMemberCount: b.approvedMemberCount,
        pendingApprovalCount: b.pendingApprovalCount,
        menuCount: b.menuCount,
        menusWithPhoto: b.menusWithPhoto,
        menusSoldOut: b.menusSoldOut,
        activeTableCount: b.activeTableCount,
        todayOrderCount: b.todayOrderCount,
        todaySales: b.todaySales,
        ordersLast7d: b.ordersLast7d,
        ordersLast30d: b.ordersLast30d,
        lastOrderAt: b.lastOrderAt,
        lastMerchantActivityAt: b.lastMerchantActivityAt,
        firstMemberAt: b.firstMemberAt,
        hasOrderEver: b.hasOrderEver,
        onboardingPercent: percent,
        onboardingFlags: flags,
        atRisk,
        health,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));

  return { ok: true, stores };
});

export async function getPlatformStoreSummary(
  tenantSlug: string,
): Promise<PlatformStoreSummary | null> {
  const slug = tenantSlug.trim();
  if (!slug) return null;
  const result = await listPlatformStores();
  if (!result.ok) return null;
  return result.stores.find((s) => s.tenantSlug === slug) ?? null;
}
