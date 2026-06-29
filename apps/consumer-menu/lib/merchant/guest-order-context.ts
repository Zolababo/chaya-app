import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatGuestItemsBrief } from "@/lib/merchant/format-guest-last-visit";
import { formatGuestLabel } from "@/lib/merchant/guest-label";
import {
  guestVisitNumberFromPrior,
  guestVisitTierFromPrior,
  type GuestVisitTier,
} from "@/lib/merchant/guest-visit-policy";
import { parseOrderLineSummaries } from "@/lib/orders/format-order-line-summary";
import { sanitizeGuestSessionId } from "@/lib/orders/guest-order-validation";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

export type MerchantGuestOrderContext = {
  guestLabel: string;
  priorCompletedCount: number;
  visitNumber: number;
  tier: GuestVisitTier;
  visitConfirmed: boolean;
  lastVisitAt: string | null;
  lastVisitTotal: number | null;
  lastVisitItemsSummary: string | null;
};

type CompletedHistoryRow = {
  id: string;
  completed_at: string;
  total_price: number;
  items: unknown;
};

function parsePrice(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parseCompletedRow(raw: Record<string, unknown>): CompletedHistoryRow | null {
  const id = raw.id;
  const completed_at = raw.completed_at ?? raw.created_at;
  if (typeof id !== "string") return null;
  const at =
    typeof completed_at === "string"
      ? completed_at
      : completed_at instanceof Date
        ? completed_at.toISOString()
        : "";
  if (!at) return null;
  return {
    id,
    completed_at: at,
    total_price: parsePrice(raw.total_price),
    items: raw.items,
  };
}

function buildContextForOrder(
  guestSessionId: string,
  orderId: string,
  status: string,
  history: CompletedHistoryRow[],
): MerchantGuestOrderContext {
  const others = history.filter((h) => h.id !== orderId);
  const priorCompletedCount = others.length;
  const visitNumber = guestVisitNumberFromPrior(priorCompletedCount);
  const tier = guestVisitTierFromPrior(priorCompletedCount);
  const visitConfirmed = status === "completed";

  const last = others.length > 0 ? others[others.length - 1]! : null;
  const lastLines = last ? parseOrderLineSummaries(last.items) : [];

  return {
    guestLabel: formatGuestLabel(guestSessionId),
    priorCompletedCount,
    visitNumber,
    tier,
    visitConfirmed,
    lastVisitAt: last?.completed_at ?? null,
    lastVisitTotal: last?.total_price ?? null,
    lastVisitItemsSummary: last ? formatGuestItemsBrief(lastLines) : null,
  };
}

export async function buildGuestOrderContexts(
  tenantSlug: string,
  orders: { id: string; guest_session_id: string | null; status: string }[],
): Promise<Map<string, MerchantGuestOrderContext>> {
  const out = new Map<string, MerchantGuestOrderContext>();
  const slug = tenantSlug.trim();
  if (!slug || orders.length === 0) return out;

  const sessionByOrderId = new Map<string, string>();
  const sessionIds = new Set<string>();
  for (const o of orders) {
    const sid = sanitizeGuestSessionId(o.guest_session_id);
    if (!sid) continue;
    sessionByOrderId.set(o.id, sid);
    sessionIds.add(sid);
  }
  if (sessionIds.size === 0) return out;

  const client = createServiceSupabase();
  if (!client) return out;

  const sessionList = [...sessionIds];
  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("id, completed_at, created_at, total_price, items, guest_session_id")
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .in("guest_session_id", sessionList)
      .order("completed_at", { ascending: true }),
  );

  if (error || !data) return out;

  const historyBySession = new Map<string, CompletedHistoryRow[]>();
  for (const raw of data as Record<string, unknown>[]) {
    const sid = sanitizeGuestSessionId(
      typeof raw.guest_session_id === "string" ? raw.guest_session_id : null,
    );
    const row = parseCompletedRow(raw);
    if (!sid || !row) continue;
    const list = historyBySession.get(sid) ?? [];
    list.push(row);
    historyBySession.set(sid, list);
  }

  for (const order of orders) {
    const sid = sessionByOrderId.get(order.id);
    if (!sid) continue;
    const history = historyBySession.get(sid) ?? [];
    out.set(order.id, buildContextForOrder(sid, order.id, order.status, history));
  }

  return out;
}

export async function recordCompletedStoreVisit(
  client: SupabaseClient,
  tenantSlug: string,
  orderId: string,
): Promise<void> {
  const slug = tenantSlug.trim();
  if (!slug || !orderId) return;

  const { data: orderRaw, error: fetchErr } = await client
    .from("orders")
    .select("id, status, guest_session_id, total_price, table_no, items, completed_at, table_session_id")
    .eq("tenant_slug", slug)
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !orderRaw || typeof orderRaw !== "object") return;
  const order = orderRaw as Record<string, unknown>;
  if (order.status !== "completed") return;

  const tableSessionId =
    typeof order.table_session_id === "string" ? order.table_session_id.trim() : "";
  if (tableSessionId) return;

  const guestSessionId = sanitizeGuestSessionId(
    typeof order.guest_session_id === "string" ? order.guest_session_id : null,
  );
  if (!guestSessionId) return;

  const { count: existingVisitCount, error: existingVisitErr } = await client
    .from("store_visits")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);

  if (existingVisitErr && /store_visits|does not exist/i.test(existingVisitErr.message ?? "")) {
    return;
  }
  if ((existingVisitCount ?? 0) > 0) return;

  const completedAt =
    typeof order.completed_at === "string"
      ? order.completed_at
      : new Date().toISOString();
  const totalPrice = parsePrice(order.total_price);
  const tableNo =
    typeof order.table_no === "string" && order.table_no.trim() ? order.table_no.trim() : null;
  const items = order.items ?? [];

  const { data: rollupRaw } = await client
    .from("tenant_guest_rollups")
    .select("completed_visit_count, lifetime_spend")
    .eq("tenant_slug", slug)
    .eq("guest_session_id", guestSessionId)
    .maybeSingle();

  const priorCount =
    rollupRaw && typeof rollupRaw === "object"
      ? Number((rollupRaw as { completed_visit_count?: unknown }).completed_visit_count) || 0
      : 0;
  const priorSpend =
    rollupRaw && typeof rollupRaw === "object"
      ? parsePrice((rollupRaw as { lifetime_spend?: unknown }).lifetime_spend)
      : 0;

  const visitNumber = priorCount + 1;

  const { error: insertErr } = await client.from("store_visits").insert({
    tenant_slug: slug,
    guest_session_id: guestSessionId,
    order_id: orderId,
    visit_number: visitNumber,
    completed_at: completedAt,
    total_price: totalPrice,
    table_no: tableNo,
    items,
  });

  if (insertErr && !/duplicate|unique/i.test(insertErr.message ?? "")) {
    if (/store_visits|does not exist/i.test(insertErr.message ?? "")) return;
    console.error("[recordCompletedStoreVisit] insert", insertErr.message);
    return;
  }

  const nextCount = insertErr && /duplicate|unique/i.test(insertErr.message ?? "") ? priorCount : priorCount + 1;
  const nextSpend =
    insertErr && /duplicate|unique/i.test(insertErr.message ?? "")
      ? priorSpend
      : priorSpend + totalPrice;

  const { error: rollupErr } = await client.from("tenant_guest_rollups").upsert(
    {
      tenant_slug: slug,
      guest_session_id: guestSessionId,
      completed_visit_count: nextCount,
      lifetime_spend: nextSpend,
      last_completed_at: completedAt,
      last_total_price: totalPrice,
      last_items: items,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_slug,guest_session_id" },
  );

  if (rollupErr && !/tenant_guest_rollups|does not exist/i.test(rollupErr.message ?? "")) {
    console.error("[recordCompletedStoreVisit] rollup", rollupErr.message);
  }
}

/** 테이블 세션 결제 1회 — 방문·집계 1행 (세션 내 주문 합산). */
export async function recordCompletedTableSessionVisit(
  client: SupabaseClient,
  tenantSlug: string,
  tableSessionId: string,
  completedAt: string,
): Promise<void> {
  const slug = tenantSlug.trim();
  const sessionId = tableSessionId.trim();
  if (!slug || !sessionId) return;

  const { count: existingCount, error: existingErr } = await client
    .from("store_visits")
    .select("id", { count: "exact", head: true })
    .eq("table_session_id", sessionId);

  if (existingErr && /store_visits|table_session_id|does not exist/i.test(existingErr.message ?? "")) {
    return;
  }
  if ((existingCount ?? 0) > 0) return;

  const { data: sessionRaw } = await client
    .from("table_sessions")
    .select("table_no")
    .eq("id", sessionId)
    .eq("tenant_slug", slug)
    .maybeSingle();

  const tableNo =
    sessionRaw && typeof (sessionRaw as { table_no?: unknown }).table_no === "string"
      ? (sessionRaw as { table_no: string }).table_no.trim()
      : null;

  const { data: orderRows, error: ordersErr } = await client
    .from("orders")
    .select("id, guest_session_id, total_price, items, completed_at")
    .eq("tenant_slug", slug)
    .eq("table_session_id", sessionId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (ordersErr || !orderRows?.length) return;

  let guestSessionId: string | null = null;
  let totalPrice = 0;
  const mergedItems: unknown[] = [];
  let repOrderId = "";

  for (const raw of orderRows as Record<string, unknown>[]) {
    if (!repOrderId && typeof raw.id === "string") repOrderId = raw.id;
    totalPrice += parsePrice(raw.total_price);
    if (!guestSessionId) {
      guestSessionId = sanitizeGuestSessionId(
        typeof raw.guest_session_id === "string" ? raw.guest_session_id : null,
      );
    }
    const items = raw.items;
    if (Array.isArray(items)) mergedItems.push(...items);
  }

  if (!guestSessionId || !repOrderId) return;

  const paidAt =
    typeof (orderRows[0] as Record<string, unknown>).completed_at === "string"
      ? ((orderRows[0] as Record<string, unknown>).completed_at as string)
      : completedAt;

  const { data: rollupRaw } = await client
    .from("tenant_guest_rollups")
    .select("completed_visit_count, lifetime_spend")
    .eq("tenant_slug", slug)
    .eq("guest_session_id", guestSessionId)
    .maybeSingle();

  const priorCount =
    rollupRaw && typeof rollupRaw === "object"
      ? Number((rollupRaw as { completed_visit_count?: unknown }).completed_visit_count) || 0
      : 0;
  const priorSpend =
    rollupRaw && typeof rollupRaw === "object"
      ? parsePrice((rollupRaw as { lifetime_spend?: unknown }).lifetime_spend)
      : 0;

  const visitNumber = priorCount + 1;

  const insertRow: Record<string, unknown> = {
    tenant_slug: slug,
    guest_session_id: guestSessionId,
    order_id: repOrderId,
    visit_number: visitNumber,
    completed_at: paidAt,
    total_price: totalPrice,
    table_no: tableNo,
    items: mergedItems,
    table_session_id: sessionId,
  };

  const { error: insertErr } = await client.from("store_visits").insert(insertRow);

  if (insertErr && !/duplicate|unique/i.test(insertErr.message ?? "")) {
    if (/store_visits|does not exist/i.test(insertErr.message ?? "")) return;
    console.error("[recordCompletedTableSessionVisit] insert", insertErr.message);
    return;
  }

  const nextCount = insertErr && /duplicate|unique/i.test(insertErr.message ?? "") ? priorCount : priorCount + 1;
  const nextSpend =
    insertErr && /duplicate|unique/i.test(insertErr.message ?? "")
      ? priorSpend
      : priorSpend + totalPrice;

  const { error: rollupErr } = await client.from("tenant_guest_rollups").upsert(
    {
      tenant_slug: slug,
      guest_session_id: guestSessionId,
      completed_visit_count: nextCount,
      lifetime_spend: nextSpend,
      last_completed_at: paidAt,
      last_total_price: totalPrice,
      last_items: mergedItems,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_slug,guest_session_id" },
  );

  if (rollupErr && !/tenant_guest_rollups|does not exist/i.test(rollupErr.message ?? "")) {
    console.error("[recordCompletedTableSessionVisit] rollup", rollupErr.message);
  }
}
