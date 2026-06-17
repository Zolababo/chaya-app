import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

import { parseOrderListRow } from "@/lib/orders/parse-order-list-row";

import { sanitizeTenantSlug } from "./guest-order-validation";
import type { GuestOrderListItem } from "./list-guest-orders";

export type UserOrdersListResult =
  | { ok: true; orders: GuestOrderListItem[] }
  | { ok: false; orders: []; errorKind: "no_client" | "no_user" | "rpc" };

export async function listUserOrdersForTenant(tenant: string): Promise<UserOrdersListResult> {
  const tenantCheck = sanitizeTenantSlug(tenant);
  if (!tenantCheck.ok) {
    return { ok: true, orders: [] };
  }

  const client = await createSupabaseServerClient();
  if (!client) return { ok: false, orders: [], errorKind: "no_client" };

  const user = await resolveServerUser(client);
  if (!user) return { ok: false, orders: [], errorKind: "no_user" };

  const { data, error } = await withSupabaseReadRetry(() =>
    client.rpc("list_orders_for_user", {
      p_tenant_slug: tenantCheck.slug,
      p_limit: 30,
    }),
  );

  if (error) {
    console.error("[listUserOrdersForTenant]", error.code ?? "", error.message);
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
