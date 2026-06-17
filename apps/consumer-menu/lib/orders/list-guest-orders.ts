import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

import type { GuestOrderLineView } from "@/lib/orders/fetch-guest-order";
import { parseOrderListRow } from "@/lib/orders/parse-order-list-row";

import {
  sanitizeGuestSessionId,
  sanitizeTenantSlug,
} from "./guest-order-validation";

export type GuestOrderListItem = {
  id: string;
  order_no: number | null;
  total_price: number;
  created_at: string | null;
  status: string;
  lines: GuestOrderLineView[];
};

export type GuestOrdersListResult =
  | { ok: true; orders: GuestOrderListItem[] }
  | { ok: false; orders: []; errorKind: "no_client" | "rpc" };

export async function listGuestOrdersForTenant(
  tenant: string,
  guestSessionId: string | null,
): Promise<GuestOrdersListResult> {
  const tenantCheck = sanitizeTenantSlug(tenant);
  if (!tenantCheck.ok) {
    return { ok: true, orders: [] };
  }

  const sid = sanitizeGuestSessionId(guestSessionId);
  if (!sid) {
    return { ok: true, orders: [] };
  }

  const client = createConsumerSupabase();
  if (!client) {
    return { ok: false, orders: [], errorKind: "no_client" };
  }

  const { data, error } = await withSupabaseReadRetry(() =>
    client.rpc("list_orders_for_guest", {
      p_tenant_slug: tenantCheck.slug,
      p_guest_session_id: sid,
      p_limit: 30,
    }),
  );

  if (error) {
    console.error("[listGuestOrdersForTenant]", error.code ?? "", error.message);
    return { ok: false, orders: [], errorKind: "rpc" };
  }
  if (data == null) {
    return { ok: false, orders: [], errorKind: "rpc" };
  }

  let rows: unknown[] = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      if (Array.isArray(parsed)) rows = parsed;
    } catch {
      return { ok: false, orders: [], errorKind: "rpc" };
    }
  } else {
    return { ok: false, orders: [], errorKind: "rpc" };
  }

  const out: GuestOrderListItem[] = [];
  for (const row of rows) {
    const item = parseOrderListRow(row);
    if (item) out.push(item);
  }
  return { ok: true, orders: out };
}
