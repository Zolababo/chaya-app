import "server-only";

import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

export type PlatformMenuTrendRow = {
  name: string;
  qty: number;
  storeCount: number;
};

export type PlatformMenuTrendsResult =
  | { ok: true; rows: PlatformMenuTrendRow[]; days: number }
  | { ok: false; message: string };

function parseOrderLine(elem: unknown): { name: string; qty: number } | null {
  if (!elem || typeof elem !== "object") return null;
  const rec = elem as Record<string, unknown>;
  const name =
    typeof rec.name === "string" && rec.name.trim()
      ? rec.name.trim()
      : typeof rec.id === "string"
        ? rec.id.trim()
        : "";
  if (!name) return null;
  const qtyRaw = typeof rec.quantity === "number" ? rec.quantity : Number(rec.quantity);
  const qty = Number.isFinite(qtyRaw) ? Math.max(1, Math.min(99, Math.floor(qtyRaw))) : 1;
  return { name, qty };
}

/** 플랫폼 전체 메뉴 판매 Top N (주문 items JSON, 최근 N일) */
export async function getPlatformMenuTrends(
  days = 30,
  limit = 5,
): Promise<PlatformMenuTrendsResult> {
  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "Supabase 서버 설정(SERVICE_ROLE)이 없습니다." };
  }

  const span = Math.max(1, Math.min(90, Math.floor(days)));
  const sinceIso = new Date(Date.now() - span * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("tenant_slug, status, items")
      .gte("created_at", sinceIso)
      .neq("status", "cancelled")
      .limit(5000),
  );

  if (error) {
    return { ok: false, message: error.message ?? "주문 데이터를 불러오지 못했습니다." };
  }

  const qtyByName = new Map<string, number>();
  const storesByName = new Map<string, Set<string>>();

  for (const row of data ?? []) {
    const slug = typeof row.tenant_slug === "string" ? row.tenant_slug.trim() : "";
    const itemsRaw = row.items;
    if (!Array.isArray(itemsRaw)) continue;
    for (const elem of itemsRaw) {
      const line = parseOrderLine(elem);
      if (!line) continue;
      qtyByName.set(line.name, (qtyByName.get(line.name) ?? 0) + line.qty);
      if (slug) {
        const set = storesByName.get(line.name) ?? new Set<string>();
        set.add(slug);
        storesByName.set(line.name, set);
      }
    }
  }

  const rows: PlatformMenuTrendRow[] = [...qtyByName.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, Math.max(1, Math.min(20, limit)))
    .map(([name, qty]) => ({
      name,
      qty,
      storeCount: storesByName.get(name)?.size ?? 0,
    }));

  return { ok: true, rows, days: span };
}
