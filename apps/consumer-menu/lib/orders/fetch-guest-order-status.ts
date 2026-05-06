import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

import { fetchGuestOrder } from "./fetch-guest-order";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `get_order_status_for_guest` 를 먼저 씁니다(세션은 주문에 guest_session_id 가 있을 때 필요).
 * RPC 미배포·스키마 불일치 등으로 실패하면 `get_order_for_guest` 한 건에서 status 를 읽습니다.
 */
export async function fetchGuestOrderStatusOnly(
  tenant: string,
  orderId: string,
  guestSessionId: string | null = null,
): Promise<string | null> {
  const slug = tenant.trim();
  if (!slug || !UUID_RE.test(orderId.trim())) {
    return null;
  }

  const client = createConsumerSupabase();
  if (!client) return null;

  const { data, error } = await withSupabaseReadRetry(() =>
    client.rpc("get_order_status_for_guest", {
      p_order_id: orderId.trim(),
      p_tenant_slug: slug,
      p_guest_session_id:
        guestSessionId != null && guestSessionId.trim().length > 0 ? guestSessionId.trim() : null,
    }),
  );

  if (!error) {
    if (data == null) return null;
    if (typeof data !== "string") return null;
    const s = data.trim();
    if (s.length > 0) return s;
    return null;
  }

  console.warn(
    "[fetchGuestOrderStatusOnly] status RPC → fallback",
    error.code ?? "",
    error.message,
  );
  const full = await fetchGuestOrder(tenant, orderId);
  return full?.status ?? null;
}
