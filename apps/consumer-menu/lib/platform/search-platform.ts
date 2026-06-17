import "server-only";

import { listPlatformStores } from "@/lib/platform/list-platform-stores";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

export type PlatformSearchStoreHit = {
  tenantSlug: string;
  displayName: string;
  healthScore: number;
  atRisk: boolean;
};

export type PlatformSearchMenuHit = {
  tenantSlug: string;
  menuId: string;
  name: string;
};

export type PlatformSearchResult =
  | {
      ok: true;
      query: string;
      stores: PlatformSearchStoreHit[];
      menus: PlatformSearchMenuHit[];
    }
  | { ok: false; message: string };

export async function searchPlatform(query: string, limit = 8): Promise<PlatformSearchResult> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return { ok: true, query: q, stores: [], menus: [] };
  }

  const storesRes = await listPlatformStores();
  if (!storesRes.ok) {
    return { ok: false, message: storesRes.message };
  }

  const storeHits: PlatformSearchStoreHit[] = storesRes.stores
    .filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.tenantSlug.toLowerCase().includes(q),
    )
    .slice(0, limit)
    .map((s) => ({
      tenantSlug: s.tenantSlug,
      displayName: s.displayName,
      healthScore: s.health.score,
      atRisk: s.atRisk,
    }));

  const client = createServiceSupabase();
  if (!client) {
    return { ok: true, query: q, stores: storeHits, menus: [] };
  }

  const { data, error } = await withSupabaseReadRetry(() =>
    client.from("ChayaMenus").select("id, name, tenant_slug").ilike("name", `%${q}%`).limit(limit * 2),
  );

  if (error) {
    return { ok: true, query: q, stores: storeHits, menus: [] };
  }

  const menus: PlatformSearchMenuHit[] = (data ?? [])
    .map((row) => {
      const menuId = typeof row.id === "string" ? row.id : String(row.id ?? "");
      const name = typeof row.name === "string" ? row.name : "";
      const tenantSlug = typeof row.tenant_slug === "string" ? row.tenant_slug : "";
      if (!menuId || !name || !tenantSlug) return null;
      return { menuId, name, tenantSlug };
    })
    .filter((x): x is PlatformSearchMenuHit => x != null)
    .slice(0, limit);

  return { ok: true, query: q, stores: storeHits, menus };
}
