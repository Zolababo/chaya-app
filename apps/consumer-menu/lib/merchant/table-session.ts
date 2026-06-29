import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { recordCompletedTableSessionVisit } from "@/lib/merchant/guest-order-context";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

export type TableSessionStatus = "open" | "paid" | "void";

const UNPAID_ORDER_STATUSES = ["pending", "accepted", "preparing", "ready"] as const;

export type OpenTableSessionSummary = {
  sessionId: string;
  tableNo: string;
  orderCount: number;
  totalAmount: number;
};

function parsePrice(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** 손님 주문 제출 후 — open 세션에 연결 (테이블 있을 때만). */
export async function attachOrderToOpenTableSession(
  tenantSlug: string,
  orderId: string,
  tableNo: string,
): Promise<void> {
  const slug = tenantSlug.trim();
  const table = tableNo.trim();
  if (!slug || !table || !orderId) return;

  const client = createServiceSupabase();
  if (!client) return;

  if (await isTableSessionsUnavailable(client)) return;

  const sessionId = await resolveOrCreateOpenTableSession(client, slug, table);
  if (!sessionId) return;

  const { error } = await client
    .from("orders")
    .update({ table_session_id: sessionId })
    .eq("id", orderId)
    .eq("tenant_slug", slug);

  if (error && !/table_session_id|does not exist/i.test(error.message ?? "")) {
    console.error("[attachOrderToOpenTableSession]", error.message);
  }
}

async function isTableSessionsUnavailable(client: SupabaseClient): Promise<boolean> {
  const { error } = await client.from("table_sessions").select("id", { head: true, count: "exact" }).limit(0);
  return Boolean(error && /table_sessions|does not exist/i.test(error.message ?? ""));
}

async function resolveOrCreateOpenTableSession(
  client: SupabaseClient,
  tenantSlug: string,
  tableNo: string,
): Promise<string | null> {
  const { data: existing, error: findErr } = await withSupabaseReadRetry(() =>
    client
      .from("table_sessions")
      .select("id")
      .eq("tenant_slug", tenantSlug)
      .eq("table_no", tableNo)
      .eq("status", "open")
      .maybeSingle(),
  );

  if (findErr && /table_sessions|does not exist/i.test(findErr.message ?? "")) {
    return null;
  }

  if (existing && typeof (existing as { id?: unknown }).id === "string") {
    return (existing as { id: string }).id;
  }

  const { data: created, error: insertErr } = await client
    .from("table_sessions")
    .insert({ tenant_slug: tenantSlug, table_no: tableNo, status: "open" })
    .select("id")
    .single();

  if (insertErr) {
    if (/duplicate|unique|idx_table_sessions_one_open/i.test(insertErr.message ?? "")) {
      const { data: retry } = await client
        .from("table_sessions")
        .select("id")
        .eq("tenant_slug", tenantSlug)
        .eq("table_no", tableNo)
        .eq("status", "open")
        .maybeSingle();
      if (retry && typeof (retry as { id?: unknown }).id === "string") {
        return (retry as { id: string }).id;
      }
    }
    console.error("[resolveOrCreateOpenTableSession]", insertErr.message);
    return null;
  }

  const id = (created as { id?: unknown } | null)?.id;
  return typeof id === "string" ? id : null;
}

/** 점주 UI — 미결제 open 세션 + 합계 (세션 내 주문 전부 서빙완료일 때만). */
export async function listOpenTableSessionSummaries(
  tenantSlug: string,
): Promise<OpenTableSessionSummary[]> {
  const slug = tenantSlug.trim();
  if (!slug) return [];

  const client = createServiceSupabase();
  if (!client) return [];

  const { data: sessions, error } = await withSupabaseReadRetry(() =>
    client
      .from("table_sessions")
      .select("id, table_no")
      .eq("tenant_slug", slug)
      .eq("status", "open")
      .order("created_at", { ascending: true }),
  );

  if (error || !sessions?.length) {
    if (error && !/table_sessions|does not exist/i.test(error.message ?? "")) {
      console.error("[listOpenTableSessionSummaries]", error.message);
    }
    return [];
  }

  const sessionIds = sessions
    .map((s) => (typeof (s as { id?: unknown }).id === "string" ? (s as { id: string }).id : ""))
    .filter(Boolean);

  if (sessionIds.length === 0) return [];

  const { data: orderRows } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("table_session_id, total_price, status")
      .eq("tenant_slug", slug)
      .in("table_session_id", sessionIds)
      .in("status", [...UNPAID_ORDER_STATUSES]),
  );

  const agg = new Map<string, { orderCount: number; totalAmount: number; allReady: boolean }>();
  for (const raw of (orderRows as Record<string, unknown>[]) ?? []) {
    const sid =
      typeof raw.table_session_id === "string" ? raw.table_session_id.trim() : "";
    if (!sid) continue;
    const status = typeof raw.status === "string" ? raw.status : "";
    const acc = agg.get(sid) ?? { orderCount: 0, totalAmount: 0, allReady: true };
    acc.orderCount += 1;
    acc.totalAmount += parsePrice(raw.total_price);
    if (status !== "ready") acc.allReady = false;
    agg.set(sid, acc);
  }

  const out: OpenTableSessionSummary[] = [];
  for (const raw of sessions as { id?: unknown; table_no?: unknown }[]) {
    const sessionId = typeof raw.id === "string" ? raw.id : "";
    const tableNo = typeof raw.table_no === "string" ? raw.table_no.trim() : "";
    if (!sessionId || !tableNo) continue;
    const a = agg.get(sessionId);
    if (!a || a.orderCount === 0 || !a.allReady) continue;
    out.push({ sessionId, tableNo, orderCount: a.orderCount, totalAmount: a.totalAmount });
  }

  return out;
}

export type CompleteTableSessionResult =
  | { ok: true; orderCount: number; totalAmount: number }
  | { ok: false; code: "not_found" | "no_orders" | "not_all_ready" | "db" | "no_service" };

/** 테이블 세션 결제 — 세션 내 미완료 주문이 모두 서빙완료(ready)일 때만. */
export async function completeTableSession(
  tenantSlug: string,
  tableNo: string,
): Promise<CompleteTableSessionResult> {
  const slug = tenantSlug.trim();
  const table = tableNo.trim();
  if (!slug || !table) return { ok: false, code: "not_found" };

  const client = createServiceSupabase();
  if (!client) return { ok: false, code: "no_service" };

  const { data: sessionRaw, error: sessionErr } = await client
    .from("table_sessions")
    .select("id")
    .eq("tenant_slug", slug)
    .eq("table_no", table)
    .eq("status", "open")
    .maybeSingle();

  if (sessionErr || !sessionRaw || typeof (sessionRaw as { id?: unknown }).id !== "string") {
    return { ok: false, code: "not_found" };
  }

  const sessionId = (sessionRaw as { id: string }).id;
  const paidAt = new Date().toISOString();

  const { data: orders, error: ordersErr } = await client
    .from("orders")
    .select("id, status, total_price, guest_session_id")
    .eq("tenant_slug", slug)
    .eq("table_session_id", sessionId)
    .in("status", [...UNPAID_ORDER_STATUSES]);

  if (ordersErr) return { ok: false, code: "db" };

  const toComplete = (orders as Record<string, unknown>[]) ?? [];
  if (toComplete.length === 0) return { ok: false, code: "no_orders" };

  if (toComplete.some((row) => (typeof row.status === "string" ? row.status : "") !== "ready")) {
    return { ok: false, code: "not_all_ready" };
  }

  let totalAmount = 0;
  const orderIds: string[] = [];
  for (const row of toComplete) {
    if (typeof row.id === "string") orderIds.push(row.id);
    totalAmount += parsePrice(row.total_price);
  }

  const { error: bulkErr } = await client
    .from("orders")
    .update({ status: "completed", completed_at: paidAt })
    .eq("tenant_slug", slug)
    .eq("table_session_id", sessionId)
    .in("status", [...UNPAID_ORDER_STATUSES]);

  if (bulkErr && /completed_at|does not exist/i.test(bulkErr.message ?? "")) {
    const { error: statusOnlyErr } = await client
      .from("orders")
      .update({ status: "completed" })
      .eq("tenant_slug", slug)
      .eq("table_session_id", sessionId)
      .in("status", [...UNPAID_ORDER_STATUSES]);
    if (statusOnlyErr) return { ok: false, code: "db" };
  } else if (bulkErr) {
    return { ok: false, code: "db" };
  }

  const { error: sessionPayErr } = await client
    .from("table_sessions")
    .update({ status: "paid", paid_at: paidAt })
    .eq("id", sessionId)
    .eq("tenant_slug", slug)
    .eq("status", "open");

  if (sessionPayErr) return { ok: false, code: "db" };

  await recordCompletedTableSessionVisit(client, slug, sessionId, paidAt);

  return { ok: true, orderCount: orderIds.length, totalAmount };
}

