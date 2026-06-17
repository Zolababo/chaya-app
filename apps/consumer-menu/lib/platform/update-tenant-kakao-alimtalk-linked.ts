import "server-only";

import { createServiceSupabase } from "@/lib/supabase/create-service-client";

export async function updateTenantKakaoAlimtalkLinked(
  tenantSlug: string,
  linked: boolean,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const tenant = tenantSlug.trim();
  if (!tenant) return { ok: false, code: "bad_tenant" };

  const client = createServiceSupabase();
  if (!client) return { ok: false, code: "no_service" };

  const { error } = await client.from("tenant_store_settings").upsert(
    {
      tenant_slug: tenant,
      kakao_alimtalk_linked_at: linked ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_slug" },
  );

  if (error) {
    console.error("[updateTenantKakaoAlimtalkLinked]", error.code ?? "", error.message);
    return { ok: false, code: "db" };
  }

  return { ok: true };
}
