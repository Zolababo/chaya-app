import "server-only";

import { isOpsOrderResetAllowed } from "@/lib/platform/ops-order-reset-allowlist";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

const MAX_DELETE = 2000;

export type ResetTenantOrdersResult =
  | { ok: true; deletedCount: number }
  | { ok: false; code: "bad_tenant" | "not_allowed" | "confirm_mismatch" | "no_service" | "too_many" | "db" };

export async function resetTenantOrdersForOps(input: {
  tenantSlug: string;
  confirmSlug: string;
}): Promise<ResetTenantOrdersResult> {
  const tenant = input.tenantSlug.trim();
  const confirm = input.confirmSlug.trim();
  if (!tenant) return { ok: false, code: "bad_tenant" };
  if (confirm !== tenant) return { ok: false, code: "confirm_mismatch" };
  if (!isOpsOrderResetAllowed(tenant)) return { ok: false, code: "not_allowed" };

  const client = createServiceSupabase();
  if (!client) return { ok: false, code: "no_service" };

  const { count, error: countErr } = await client
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("tenant_slug", tenant);

  if (countErr) {
    console.error("[resetTenantOrdersForOps count]", countErr.code ?? "", countErr.message);
    return { ok: false, code: "db" };
  }

  const total = count ?? 0;
  if (total > MAX_DELETE) {
    return { ok: false, code: "too_many" };
  }

  const { error: delErr } = await client.from("orders").delete().eq("tenant_slug", tenant);
  if (delErr) {
    console.error("[resetTenantOrdersForOps delete]", delErr.code ?? "", delErr.message);
    return { ok: false, code: "db" };
  }

  await client.from("tenant_order_counters").upsert(
    { tenant_slug: tenant, last_no: 0 },
    { onConflict: "tenant_slug" },
  );

  return { ok: true, deletedCount: total };
}
