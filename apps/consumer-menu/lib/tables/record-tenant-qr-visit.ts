import "server-only";

import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { listActiveTenantTablesForConsumer } from "@/lib/tables/list-tenant-tables";
import { normalizeTableCode } from "@/lib/tables/tenant-table-code";

const KST = "Asia/Seoul";

function kstDayKey(nowMs = Date.now()): string {
  return new Date(nowMs).toLocaleDateString("en-CA", { timeZone: KST });
}

/** QR/table 유입 1회 기록 (비차단). 테이블 미등록·비활성이면 무시. */
export async function recordTenantQrVisit(tenantSlug: string, tableRaw: string): Promise<void> {
  const tenant = tenantSlug.trim();
  const norm = normalizeTableCode(tableRaw);
  if (!tenant || !norm.ok) return;

  const tables = await listActiveTenantTablesForConsumer(tenant);
  if (!tables.some((t) => t.table_code === norm.code)) return;

  const client = createServiceSupabase();
  if (!client) return;

  const day_key = kstDayKey();
  const { error } = await client.from("tenant_qr_visits").insert({
    tenant_slug: tenant,
    table_code: norm.code,
    day_key,
  });

  if (error) {
    console.error("[recordTenantQrVisit]", error.code ?? "", error.message);
  }
}
