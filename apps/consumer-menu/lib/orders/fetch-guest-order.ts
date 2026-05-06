import { cookies } from "next/headers";

import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type GuestOrderLineView = {
  name: string;
  quantity: number;
  price: number;
};

export type GuestOrderView = {
  id: string;
  total_price: number;
  created_at: string | null;
  lines: GuestOrderLineView[];
  table_no: string | null;
  guest_note: string | null;
  status: string;
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeLines(raw: unknown): GuestOrderLineView[] {
  if (!Array.isArray(raw)) return [];
  const out: GuestOrderLineView[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name : null;
    const qty = num(o.quantity);
    const price = num(o.price);
    if (name == null || qty == null || price == null) continue;
    out.push({ name, quantity: Math.max(0, Math.floor(qty)), price });
  }
  return out;
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function normalizeOrderRow(raw: Record<string, unknown>): GuestOrderView | null {
  const id = raw.id;
  if (typeof id !== "string") return null;
  const total = num(raw.total_price);
  if (total == null) return null;
  const created =
    typeof raw.created_at === "string"
      ? raw.created_at
      : raw.created_at instanceof Date
        ? raw.created_at.toISOString()
        : null;
  const lines = normalizeLines(raw.items);
  const statusRaw = raw.status;
  const status =
    typeof statusRaw === "string" && statusRaw.trim() ? statusRaw.trim() : "pending";
  return {
    id,
    total_price: total,
    created_at: created,
    lines,
    table_no: strOrNull(raw.table_no),
    guest_note: strOrNull(raw.guest_note),
    status,
  };
}

/** RPC `get_order_for_guest` — 없으면 null (`GuestSessionCookieSync` 로 쿠키가 있으면 세션 전달) */
export async function fetchGuestOrder(tenant: string, orderId: string): Promise<GuestOrderView | null> {
  const slug = tenant.trim();
  if (!slug || !UUID_RE.test(orderId.trim())) {
    return null;
  }

  const client = createConsumerSupabase();
  if (!client) return null;

  const jar = await cookies();
  const raw = jar.get(GUEST_SESSION_STORAGE_KEY)?.value;
  let guestSessionId: string | null = null;
  if (raw) {
    try {
      const decoded = decodeURIComponent(raw).trim();
      if (decoded.length >= 8 && decoded.length <= 128) guestSessionId = decoded;
    } catch {
      guestSessionId = null;
    }
  }

  const { data, error } = await withSupabaseReadRetry(() =>
    client.rpc("get_order_for_guest", {
      p_order_id: orderId.trim(),
      p_tenant_slug: slug,
      p_guest_session_id: guestSessionId,
    }),
  );

  if (error || data == null || typeof data !== "object") {
    return null;
  }

  return normalizeOrderRow(data as Record<string, unknown>);
}
