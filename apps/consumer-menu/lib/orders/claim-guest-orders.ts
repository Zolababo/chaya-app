import { sanitizeGuestSessionId, sanitizeTenantSlug } from "@/lib/orders/guest-order-validation";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export type ClaimGuestOrdersResult =
  | { ok: true; claimed: number }
  | { ok: false; errorKind: "no_client" | "no_user" | "rpc" };

export async function claimGuestOrdersForCurrentUser(
  tenant: string,
  guestSessionId: string | null,
): Promise<ClaimGuestOrdersResult> {
  const tenantCheck = sanitizeTenantSlug(tenant);
  const sid = sanitizeGuestSessionId(guestSessionId);
  if (!tenantCheck.ok || !sid) {
    return { ok: true, claimed: 0 };
  }

  const client = await createSupabaseServerClient();
  if (!client) return { ok: false, errorKind: "no_client" };

  const user = await resolveServerUser(client);
  if (!user) return { ok: false, errorKind: "no_user" };

  const { data, error } = await client.rpc("claim_guest_orders_for_user", {
    p_tenant_slug: tenantCheck.slug,
    p_guest_session_id: sid,
  });

  if (error) {
    console.error("[claimGuestOrdersForCurrentUser]", error.code ?? "", error.message);
    return { ok: false, errorKind: "rpc" };
  }

  const claimed = typeof data === "number" ? data : Number(data);
  return { ok: true, claimed: Number.isFinite(claimed) ? Math.max(0, Math.trunc(claimed)) : 0 };
}
