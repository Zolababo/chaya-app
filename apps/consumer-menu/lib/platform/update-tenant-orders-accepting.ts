import "server-only";

import { createServiceSupabase } from "@/lib/supabase/create-service-client";

export async function updateTenantOrdersAccepting(
  tenantSlug: string,
  ordersAccepting: boolean,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const tenant = tenantSlug.trim();
  if (!tenant) return { ok: false, code: "bad_tenant" };

  const client = createServiceSupabase();
  if (!client) return { ok: false, code: "no_service" };

  const { error } = await client.from("tenant_store_settings").upsert(
    {
      tenant_slug: tenant,
      orders_accepting: ordersAccepting,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_slug" },
  );

  if (error) {
    console.error("[updateTenantOrdersAccepting]", error.code ?? "", error.message);
    return { ok: false, code: "db" };
  }

  return { ok: true };
}
