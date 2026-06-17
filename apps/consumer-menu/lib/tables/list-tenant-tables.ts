import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import type { TenantTableRow } from "./types";

function mapRow(r: Record<string, unknown>): TenantTableRow | null {
  const id = typeof r.id === "string" ? r.id : String(r.id ?? "");
  const table_code = typeof r.table_code === "string" ? r.table_code.trim() : "";
  if (!id || !table_code) return null;
  const label = typeof r.label === "string" ? r.label.trim() || null : null;
  const sort_order =
    typeof r.sort_order === "number" && Number.isFinite(r.sort_order)
      ? Math.trunc(r.sort_order)
      : 0;
  const is_active = r.is_active === true || r.is_active === "true";
  return { id, table_code, label, sort_order, is_active };
}

/** 손님앱: 활성 테이블만 (anon RLS). */
async function listActiveTenantTablesUncached(slug: string): Promise<TenantTableRow[]> {
  const client = createConsumerSupabase();
  if (!client) return [];

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("tenant_tables")
      .select("id, table_code, label, sort_order, is_active")
      .eq("tenant_slug", slug)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("table_code", { ascending: true }),
  );

  if (error) {
    console.error("[listActiveTenantTablesForConsumer]", error.code ?? "", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((r): r is TenantTableRow => r != null);
}

export const listActiveTenantTablesForConsumer = cache(async function listActiveTenantTablesForConsumer(
  tenantSlug: string,
): Promise<TenantTableRow[]> {
  const slug = tenantSlug.trim();
  if (!slug) return [];

  return unstable_cache(
    () => listActiveTenantTablesUncached(slug),
    ["chaya-consumer-tables", slug],
    { revalidate: 60, tags: [`chaya-tables-${slug}`] },
  )();
});

/** 점주앱: 활성·비활성 포함. */
export async function listTenantTablesForMerchant(
  tenantSlug: string,
): Promise<{ ok: true; items: TenantTableRow[] } | { ok: false; message: string }> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "tenant_slug 가 없습니다." };

  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "서버 설정(SUPABASE_SERVICE_ROLE_KEY)이 없습니다." };
  }

  const { data, error } = await client
    .from("tenant_tables")
    .select("id, table_code, label, sort_order, is_active")
    .eq("tenant_slug", slug)
    .order("sort_order", { ascending: true })
    .order("table_code", { ascending: true });

  if (error) {
    console.error("[listTenantTablesForMerchant]", error.code ?? "", error.message);
    const msg = (error.message ?? "").toLowerCase();
    if (
      error.code === "42P01" ||
      msg.includes("tenant_tables") ||
      msg.includes("does not exist") ||
      msg.includes("schema cache")
    ) {
      return {
        ok: false,
        message:
          "테이블 DB가 아직 없습니다. Supabase에 마이그레이션 supabase/migrations/20260522120000_tenant_tables.sql 을 적용한 뒤 새로고침하세요.",
      };
    }
    return { ok: false, message: `테이블 목록을 불러오지 못했습니다. (${error.code ?? "error"})` };
  }

  const items = (data ?? [])
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((r): r is TenantTableRow => r != null);

  return { ok: true, items };
}
