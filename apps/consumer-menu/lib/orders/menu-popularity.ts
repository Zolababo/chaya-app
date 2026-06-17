import {
  MENU_POPULARITY_LOOKBACK_DAYS,
  MENU_POPULARITY_MIN_ORDERS,
} from "@/lib/menus/menu-merchandising";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";
import { unstable_cache } from "next/cache";

export type MenuPopularityResult = {
  ok: boolean;
  /** 집계 기간 내 주문 건수(최근 인기 노출 여부 판단). */
  periodOrderCount: number;
  /** 판매 수량 내림차순 메뉴 id. */
  rankedMenuIds: string[];
};

const MAX_ORDERS_SCAN = 800;

function parseOrderLineMenuId(elem: unknown): { id: string; qty: number } | null {
  if (!elem || typeof elem !== "object") return null;
  const rec = elem as Record<string, unknown>;
  const id = typeof rec.id === "string" ? rec.id.trim() : "";
  if (!id) return null;
  const qtyRaw = typeof rec.quantity === "number" ? rec.quantity : Number(rec.quantity);
  const qty = Number.isFinite(qtyRaw) ? Math.max(1, Math.min(99, Math.floor(qtyRaw))) : 1;
  return { id, qty };
}

/** orders.items JSON 기준 테넌트·기간별 메뉴 수량 집계 (service role). */
async function getMenuPopularityUncached(slug: string): Promise<MenuPopularityResult> {
  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, periodOrderCount: 0, rankedMenuIds: [] };
  }

  const sinceIso = new Date(
    Date.now() - MENU_POPULARITY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("items")
      .eq("tenant_slug", slug)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(MAX_ORDERS_SCAN),
  );

  if (error) {
    return { ok: false, periodOrderCount: 0, rankedMenuIds: [] };
  }

  const rows = data ?? [];
  const qtyByMenu = new Map<string, number>();

  for (const row of rows) {
    const itemsRaw = (row as { items?: unknown }).items;
    if (!Array.isArray(itemsRaw)) continue;
    for (const elem of itemsRaw) {
      const parsed = parseOrderLineMenuId(elem);
      if (!parsed) continue;
      qtyByMenu.set(parsed.id, (qtyByMenu.get(parsed.id) ?? 0) + parsed.qty);
    }
  }

  const rankedMenuIds = [...qtyByMenu.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);

  return {
    ok: true,
    periodOrderCount: rows.length,
    rankedMenuIds,
  };
}

export async function getMenuPopularityForTenant(tenantSlug: string): Promise<MenuPopularityResult> {
  const slug = tenantSlug.trim();
  if (!slug) {
    return { ok: false, periodOrderCount: 0, rankedMenuIds: [] };
  }

  return unstable_cache(
    () => getMenuPopularityUncached(slug),
    ["chaya-menu-popularity", slug],
    { revalidate: 120, tags: [`chaya-menu-popularity-${slug}`] },
  )();
}

export function shouldShowRecentPopularSection(popularity: MenuPopularityResult): boolean {
  return (
    popularity.ok &&
    popularity.periodOrderCount >= MENU_POPULARITY_MIN_ORDERS &&
    popularity.rankedMenuIds.length >= 2
  );
}
