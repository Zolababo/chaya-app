import "server-only";

import {
  parseTenantBillingPlan,
  type TenantBillingPlan,
} from "@/lib/tenant/tenant-billing-plan";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

export async function updateTenantBillingPlan(
  tenantSlug: string,
  plan: TenantBillingPlan,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const tenant = tenantSlug.trim();
  if (!tenant) return { ok: false, code: "bad_tenant" };

  const billing_plan = parseTenantBillingPlan(plan);
  const client = createServiceSupabase();
  if (!client) return { ok: false, code: "no_service" };

  const { error } = await client.from("tenant_store_settings").upsert(
    {
      tenant_slug: tenant,
      billing_plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_slug" },
  );

  if (error) {
    console.error("[updateTenantBillingPlan]", error.code ?? "", error.message);
    return { ok: false, code: "db" };
  }

  return { ok: true };
}
