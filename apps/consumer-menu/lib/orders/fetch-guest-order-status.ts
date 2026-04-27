import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** RPC `get_order_status_for_guest` — 없거나 오류면 null */
export async function fetchGuestOrderStatusOnly(
  tenant: string,
  orderId: string,
): Promise<string | null> {
  const slug = tenant.trim();
  if (!slug || !UUID_RE.test(orderId.trim())) {
    return null;
  }

  const client = createConsumerSupabase();
  if (!client) return null;

  const { data, error } = await client.rpc("get_order_status_for_guest", {
    p_order_id: orderId.trim(),
    p_tenant_slug: slug,
  });

  if (error) {
    console.error("[fetchGuestOrderStatusOnly]", error.code ?? "", error.message);
    return null;
  }
  if (data == null) return null;
  if (typeof data !== "string") return null;
  const s = data.trim();
  return s.length > 0 ? s : null;
}
