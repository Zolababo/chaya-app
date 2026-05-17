import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

import { sanitizeTenantSlug } from "./guest-order-validation";
import type { GuestOrderListItem } from "./list-guest-orders";

export type UserOrdersListResult =
  | { ok: true; orders: GuestOrderListItem[] }
  | { ok: false; orders: []; errorKind: "no_client" | "no_user" | "rpc" };

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseRow(raw: unknown): GuestOrderListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  const total = num(o.total_price);
  if (!id || total == null) return null;
  const created =
    typeof o.created_at === "string"
      ? o.created_at
      : o.created_at instanceof Date
        ? o.created_at.toISOString()
        : null;
  const st = o.status;
  const status = typeof st === "string" && st.trim() ? st.trim() : "pending";
  return { id, total_price: total, created_at: created, status };
}

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
    const item = parseRow(row);
    if (item) out.push(item);
  }
  return { ok: true, orders: out };
}
