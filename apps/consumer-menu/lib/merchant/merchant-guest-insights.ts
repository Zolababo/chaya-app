import "server-only";

import { formatGuestItemsBrief } from "@/lib/merchant/format-guest-last-visit";
import { recordCompletedStoreVisit, recordCompletedTableSessionVisit } from "@/lib/merchant/guest-order-context";
import {
  buildGuestFrequencyCounts,
  emptyGuestFrequencyCounts,
  isActiveRegularGuest,
  msSinceWindowDays,
  type GuestFrequencyCounts,
} from "@/lib/merchant/guest-visit-policy";
import {
  countPaymentEventsFromOrderRows,
  countPaymentEventsFromStoreVisitRows,
  paymentEventKeyFromOrderRow,
  paymentEventKeyFromStoreVisitRow,
} from "@/lib/merchant/payment-event-count";
import { parseOrderLineSummaries } from "@/lib/orders/format-order-line-summary";
import { getTenantCurrentBusinessDayBounds, resolveTenantAnalyticsTimeBounds } from "@/lib/merchant/resolve-tenant-analytics-bounds";
import type { MerchantAnalyticsRequest } from "@/lib/orders/merchant-analytics";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry, withSupabaseReadRetryResult } from "@/lib/supabase/transient-retry";

const GUEST_LIST_TOP = 8;

export type MerchantGuestListRow = {
  visitCountInPeriod: number;
  lifetimeVisitCount: number;
  visitsLast7: number;
  visitsLast30: number;
  visitsLast90: number;
  periodSpend: number;
  lastCompletedAt: string;
  itemsSummary: string;
  isRegular: boolean;
  isReturning: boolean;
};

export type MerchantGuestInsightsSnapshot =
  | {
      ok: true;
      periodLabel: string;
      completedVisits: number;
      uniqueGuests: number;
      returningGuests: number;
      regularGuests: number;
      guests: MerchantGuestListRow[];
      guestsHiddenCount: number;
    }
  | { ok: false; message: string };

export type MerchantTodayGuestSummary =
  | {
      ok: true;
      /** 영업일 구간 안내 */
      rangeLabel: string;
      todayCompletedVisits: number;
      todayFirstVisitGuests: number;
      todayReturningGuests: number;
    }
  | { ok: false; message: string };

function parsePrice(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function sortGuestRows(rows: MerchantGuestListRow[]): MerchantGuestListRow[] {
  return [...rows].sort((a, b) => {
    if (a.isRegular !== b.isRegular) return a.isRegular ? -1 : 1;
    if (a.visitsLast90 !== b.visitsLast90) return b.visitsLast90 - a.visitsLast90;
    if (a.visitCountInPeriod !== b.visitCountInPeriod) {
      return b.visitCountInPeriod - a.visitCountInPeriod;
    }
    return b.periodSpend - a.periodSpend;
  });
}

async function loadGuestFrequencyWindows(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  sessionIds: string[],
): Promise<Map<string, GuestFrequencyCounts>> {
  const out = new Map<string, GuestFrequencyCounts>();
  if (sessionIds.length === 0) return out;

  const since90Iso = new Date(msSinceWindowDays(90)).toISOString();
  const bySession = new Map<string, string[]>();

  const { data: visitRows, error: visitErr } = await withSupabaseReadRetry(() =>
    client
      .from("store_visits")
      .select("guest_session_id, completed_at")
      .eq("tenant_slug", slug)
      .gte("completed_at", since90Iso)
      .in("guest_session_id", sessionIds),
  );

  if (!visitErr && visitRows) {
    for (const raw of visitRows as Record<string, unknown>[]) {
      const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
      const at =
        typeof raw.completed_at === "string"
          ? raw.completed_at
          : raw.completed_at instanceof Date
            ? raw.completed_at.toISOString()
            : "";
      if (!sid || !at) continue;
      const list = bySession.get(sid) ?? [];
      list.push(at);
      bySession.set(sid, list);
    }
  } else {
    const first = await withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("guest_session_id, completed_at, created_at")
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .not("guest_session_id", "is", null)
        .in("guest_session_id", sessionIds)
        .gte("completed_at", since90Iso),
    );
    let orderRows = (first.data as Record<string, unknown>[] | null) ?? null;
    if (first.error && /completed_at|does not exist/i.test(first.error.message ?? "")) {
      const legacy = await withSupabaseReadRetry(() =>
        client
          .from("orders")
          .select("guest_session_id, created_at")
          .eq("tenant_slug", slug)
          .eq("status", "completed")
          .not("guest_session_id", "is", null)
          .in("guest_session_id", sessionIds)
          .gte("created_at", since90Iso),
      );
      orderRows = (legacy.data as Record<string, unknown>[] | null) ?? null;
    }
    for (const raw of orderRows ?? []) {
      const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
      const at =
        typeof raw.completed_at === "string"
          ? raw.completed_at
          : typeof raw.created_at === "string"
            ? raw.created_at
            : "";
      if (!sid || !at) continue;
      const list = bySession.get(sid) ?? [];
      list.push(at);
      bySession.set(sid, list);
    }
  }

  const nowMs = Date.now();
  for (const sid of sessionIds) {
    out.set(sid, buildGuestFrequencyCounts(bySession.get(sid) ?? [], nowMs));
  }
  return out;
}

function guestPaidOrdersPeriodOrFilter(
  sinceIso: string,
  untilIso: string,
  untilOp: "lte" | "lt" = "lte",
): string {
  const end = untilOp === "lt" ? "lt" : "lte";
  return (
    `and(completed_at.gte.${sinceIso},completed_at.${end}.${untilIso}),` +
    `and(completed_at.is.null,created_at.gte.${sinceIso},created_at.${end}.${untilIso})`
  );
}

/** 기간 내 guest_session 있는 결제 이벤트 수 — 주문 기준(세션당 1). */
async function countCompletedGuestPaymentEventsInPeriod(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  sinceIso: string,
  untilIso: string,
): Promise<number> {
  const first = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("id, table_session_id")
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .not("guest_session_id", "is", null)
      .or(guestPaidOrdersPeriodOrFilter(sinceIso, untilIso, "lte")),
  );

  let rows = (first.data as Record<string, unknown>[] | null) ?? null;
  if (first.error && /completed_at|does not exist/i.test(first.error.message ?? "")) {
    const legacy = await withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("id, table_session_id")
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .not("guest_session_id", "is", null)
        .gte("created_at", sinceIso)
        .lte("created_at", untilIso),
    );
    rows = (legacy.data as Record<string, unknown>[] | null) ?? null;
  } else if (first.error) {
    return 0;
  }

  return countPaymentEventsFromOrderRows(rows ?? []);
}

/** @deprecated gap 감지용 — raw 주문 건수 */
async function countCompletedGuestOrdersInPeriod(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  sinceIso: string,
  untilIso: string,
): Promise<number> {
  const probe = await withSupabaseReadRetryResult(() =>
    client
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .not("guest_session_id", "is", null)
      .or(guestPaidOrdersPeriodOrFilter(sinceIso, untilIso, "lte")),
  );

  if (probe.error && /completed_at|does not exist/i.test(probe.error.message ?? "")) {
    const legacy = await withSupabaseReadRetryResult(() =>
      client
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .not("guest_session_id", "is", null)
        .gte("created_at", sinceIso)
        .lte("created_at", untilIso),
    );
    return legacy.count ?? 0;
  }

  if (probe.error) return 0;
  return probe.count ?? 0;
}

async function resolveGuestInsightsWithStoreVisitsGap(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  sinceIso: string,
  untilIso: string,
  periodLabel: string,
  visitRowCount: number,
  orderCount: number,
): Promise<MerchantGuestInsightsSnapshot | null> {
  // store_visits 없고 주문만 있을 때 — 누락 보정·orders 폴백
  if (visitRowCount === 0 && orderCount > 0) {
    void backfillMissingStoreVisitsInPeriod(client, slug, sinceIso, untilIso);
    return fallbackGuestInsightsFromOrders(client, slug, sinceIso, untilIso, periodLabel);
  }

  // 테이블 세션: 주문 N건·방문 1건은 정상 — orders 폴백으로 덮어쓰지 않음
  if (orderCount > visitRowCount) {
    void backfillMissingStoreVisitsInPeriod(client, slug, sinceIso, untilIso);
  }

  return null;
}

export async function getMerchantGuestInsights(
  tenantSlug: string,
  req: MerchantAnalyticsRequest,
): Promise<MerchantGuestInsightsSnapshot> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "테넌트가 없습니다." };

  const bounds = await resolveTenantAnalyticsTimeBounds(slug, req);
  if (!bounds.ok) return { ok: false, message: bounds.message };

  const { sinceIso, untilIso, periodLabel } = bounds;

  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "Supabase 서버 설정이 없습니다." };
  }

  const { data: periodVisits, error: visitErr } = await withSupabaseReadRetry(() =>
    client
      .from("store_visits")
      .select("guest_session_id, completed_at, total_price, items, order_id, table_session_id")
      .eq("tenant_slug", slug)
      .gte("completed_at", sinceIso)
      .lte("completed_at", untilIso)
      .order("completed_at", { ascending: false }),
  );

  if (visitErr && /store_visits|does not exist/i.test(visitErr.message ?? "")) {
    return fallbackGuestInsightsFromOrders(client, slug, sinceIso, untilIso, periodLabel);
  }
  if (visitErr) {
    return { ok: false, message: visitErr.message ?? "손님 데이터를 불러오지 못했습니다." };
  }

  const periodRows = (periodVisits as Record<string, unknown>[]) ?? [];

  type PeriodAcc = {
    visitCountInPeriod: number;
    periodSpend: number;
    lastCompletedAt: string;
    lastItems: unknown;
    seenPayments: Set<string>;
  };
  const periodBySession = new Map<string, PeriodAcc>();

  for (const raw of periodRows) {
    const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
    if (sid.length < 8) continue;
    const payKey = paymentEventKeyFromStoreVisitRow(raw);
    if (!payKey) continue;
    const at =
      typeof raw.completed_at === "string"
        ? raw.completed_at
        : raw.completed_at instanceof Date
          ? raw.completed_at.toISOString()
          : "";
    if (!at) continue;
    const acc = periodBySession.get(sid) ?? {
      visitCountInPeriod: 0,
      periodSpend: 0,
      lastCompletedAt: at,
      lastItems: raw.items,
      seenPayments: new Set<string>(),
    };
    if (!acc.seenPayments.has(payKey)) {
      acc.seenPayments.add(payKey);
      acc.visitCountInPeriod += 1;
      acc.periodSpend += parsePrice(raw.total_price);
    }
    if (at > acc.lastCompletedAt) {
      acc.lastCompletedAt = at;
      acc.lastItems = raw.items;
    }
    periodBySession.set(sid, acc);
  }

  const visitRowCount = countPaymentEventsFromStoreVisitRows(periodRows);
  const orderCount = await countCompletedGuestOrdersInPeriod(client, slug, sinceIso, untilIso);
  const paymentEventCount = await countCompletedGuestPaymentEventsInPeriod(
    client,
    slug,
    sinceIso,
    untilIso,
  );

  const gapSnapshot = await resolveGuestInsightsWithStoreVisitsGap(
    client,
    slug,
    sinceIso,
    untilIso,
    periodLabel,
    visitRowCount,
    orderCount,
  );
  if (gapSnapshot) return gapSnapshot;

  if (periodBySession.size === 0) {
    return {
      ok: true,
      periodLabel,
      completedVisits: 0,
      uniqueGuests: 0,
      returningGuests: 0,
      regularGuests: 0,
      guests: [],
      guestsHiddenCount: 0,
    };
  }

  const sessionIds = [...periodBySession.keys()];
  const { data: rollupRows, error: rollupErr } = await withSupabaseReadRetry(() =>
    client
      .from("tenant_guest_rollups")
      .select("guest_session_id, completed_visit_count, last_items")
      .eq("tenant_slug", slug)
      .in("guest_session_id", sessionIds),
  );

  if (rollupErr && /tenant_guest_rollups|does not exist/i.test(rollupErr.message ?? "")) {
    const frequencyBySession = await loadGuestFrequencyWindows(client, slug, sessionIds);
    return buildGuestSnapshotFromPeriodMap(
      periodBySession,
      periodLabel,
      paymentEventCount > 0 ? paymentEventCount : visitRowCount,
      null,
      frequencyBySession,
    );
  }
  if (rollupErr) {
    return { ok: false, message: rollupErr.message ?? "손님 데이터를 불러오지 못했습니다." };
  }

  const rollupBySession = new Map<string, Record<string, unknown>>();
  for (const raw of (rollupRows as Record<string, unknown>[]) ?? []) {
    const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
    if (sid) rollupBySession.set(sid, raw);
  }

  const frequencyBySession = await loadGuestFrequencyWindows(client, slug, sessionIds);

  return buildGuestSnapshotFromPeriodMap(
    periodBySession,
    periodLabel,
    paymentEventCount > 0 ? paymentEventCount : visitRowCount,
    rollupBySession,
    frequencyBySession,
  );
}

function buildGuestSnapshotFromPeriodMap(
  periodBySession: Map<
    string,
    {
      visitCountInPeriod: number;
      periodSpend: number;
      lastCompletedAt: string;
      lastItems: unknown;
    }
  >,
  periodLabel: string,
  completedVisits: number,
  rollupBySession: Map<string, Record<string, unknown>> | null,
  frequencyBySession: Map<string, GuestFrequencyCounts>,
): MerchantGuestInsightsSnapshot {
  const guests: MerchantGuestListRow[] = [];
  let returningGuests = 0;
  let regularGuests = 0;

  for (const [sid, acc] of periodBySession) {
    const raw = rollupBySession?.get(sid);
    const lifetimeVisitCount = raw
      ? Number(raw.completed_visit_count) || acc.visitCountInPeriod
      : acc.visitCountInPeriod;
    const freq = frequencyBySession.get(sid) ?? emptyGuestFrequencyCounts();
    const isReturning = lifetimeVisitCount >= 2;
    const isRegular = isActiveRegularGuest(freq.visitsLast90);
    if (isReturning) returningGuests += 1;
    if (isRegular) regularGuests += 1;

    const items = raw?.last_items ?? acc.lastItems;
    guests.push({
      visitCountInPeriod: acc.visitCountInPeriod,
      lifetimeVisitCount,
      visitsLast7: freq.visitsLast7,
      visitsLast30: freq.visitsLast30,
      visitsLast90: freq.visitsLast90,
      periodSpend: acc.periodSpend,
      lastCompletedAt: acc.lastCompletedAt,
      itemsSummary: formatGuestItemsBrief(parseOrderLineSummaries(items)),
      isRegular,
      isReturning,
    });
  }

  const sorted = sortGuestRows(guests);
  const top = sorted.slice(0, GUEST_LIST_TOP);

  return {
    ok: true,
    periodLabel,
    completedVisits,
    uniqueGuests: guests.length,
    returningGuests,
    regularGuests,
    guests: top,
    guestsHiddenCount: Math.max(0, sorted.length - top.length),
  };
}

async function fallbackGuestInsightsFromOrders(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  sinceIso: string,
  untilIso: string,
  label: string,
): Promise<MerchantGuestInsightsSnapshot> {
  const first = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("id, guest_session_id, total_price, completed_at, created_at, items, table_session_id")
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .not("guest_session_id", "is", null)
      .or(guestPaidOrdersPeriodOrFilter(sinceIso, untilIso, "lte"))
      .order("created_at", { ascending: false }),
  );
  let data: Record<string, unknown>[] | null =
    (first.data as Record<string, unknown>[] | null) ?? null;
  const error = first.error;

  if (error && /completed_at|does not exist/i.test(error.message ?? "")) {
    const fallback = await withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("id, guest_session_id, total_price, created_at, items, table_session_id")
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .not("guest_session_id", "is", null)
        .gte("created_at", sinceIso)
        .lte("created_at", untilIso)
        .order("created_at", { ascending: false }),
    );
    if (fallback.error) {
      return { ok: false, message: fallback.error.message ?? "손님 데이터를 불러오지 못했습니다." };
    }
    data = (fallback.data as Record<string, unknown>[] | null) ?? null;
  } else if (error) {
    return { ok: false, message: error.message ?? "손님 데이터를 불러오지 못했습니다." };
  }

  type Acc = {
    visitCountInPeriod: number;
    periodSpend: number;
    lastCompletedAt: string;
    lastItems: unknown;
    seenPayments: Set<string>;
  };
  const bySession = new Map<string, Acc>();
  const globalPaymentKeys = new Set<string>();

  for (const row of data ?? []) {
    const sid = typeof row.guest_session_id === "string" ? row.guest_session_id.trim() : "";
    if (sid.length < 8) continue;
    const payKey = paymentEventKeyFromOrderRow(row);
    if (!payKey) continue;
    const at =
      typeof row.completed_at === "string"
        ? row.completed_at
        : typeof row.created_at === "string"
          ? row.created_at
          : "";
    if (!at) continue;

    const acc = bySession.get(sid) ?? {
      visitCountInPeriod: 0,
      periodSpend: 0,
      lastCompletedAt: at,
      lastItems: row.items,
      seenPayments: new Set<string>(),
    };
    if (!acc.seenPayments.has(payKey)) {
      acc.seenPayments.add(payKey);
      acc.visitCountInPeriod += 1;
      globalPaymentKeys.add(payKey);
    }
    acc.periodSpend += parsePrice(row.total_price);
    if (at > acc.lastCompletedAt) {
      acc.lastCompletedAt = at;
      acc.lastItems = row.items;
    }
    bySession.set(sid, acc);
  }

  const completedVisits = globalPaymentKeys.size;

  const rollupBySession = await loadLifetimeVisitRollupsFromRollupsTable(
    client,
    slug,
    [...bySession.keys()],
  );

  const frequencyBySession = await loadGuestFrequencyWindows(client, slug, [...bySession.keys()]);

  return buildGuestSnapshotFromPeriodMap(
    bySession,
    label,
    completedVisits,
    rollupBySession,
    frequencyBySession,
  );
}

/** tenant_guest_rollups — 누적 방문(결제) 횟수 (주문 수 아님). */
async function loadLifetimeVisitRollupsFromRollupsTable(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  sessionIds: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const rollupBySession = new Map<string, Record<string, unknown>>();
  if (sessionIds.length === 0) return rollupBySession;

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("tenant_guest_rollups")
      .select("guest_session_id, completed_visit_count, last_items")
      .eq("tenant_slug", slug)
      .in("guest_session_id", sessionIds),
  );

  if (error || !data) return rollupBySession;

  for (const raw of data as Record<string, unknown>[]) {
    const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
    if (sid) rollupBySession.set(sid, raw);
  }

  return rollupBySession;
}

const BACKFILL_VISITS_MAX = 50;

/** store_visits 누락분만 백그라운드 보정 — 응답은 막지 않음. */
async function backfillMissingStoreVisitsInPeriod(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  sinceIso: string,
  untilIso: string,
): Promise<void> {
  try {
    const first = await client
      .from("orders")
      .select("id, table_session_id, completed_at, created_at")
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .not("guest_session_id", "is", null)
      .or(guestPaidOrdersPeriodOrFilter(sinceIso, untilIso, "lte"))
      .order("created_at", { ascending: false })
      .limit(BACKFILL_VISITS_MAX);

    let rows = (first.data as Record<string, unknown>[] | null) ?? null;
    if (first.error && /completed_at|does not exist/i.test(first.error.message ?? "")) {
      const legacy = await client
        .from("orders")
        .select("id, table_session_id, created_at")
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .not("guest_session_id", "is", null)
        .gte("created_at", sinceIso)
        .lte("created_at", untilIso)
        .order("created_at", { ascending: false })
        .limit(BACKFILL_VISITS_MAX);
      rows = (legacy.data as Record<string, unknown>[] | null) ?? null;
    } else if (first.error) {
      return;
    }

    const orderRows = rows ?? [];
    if (orderRows.length === 0) return;

    const orderIds = orderRows
      .map((row) => (typeof row.id === "string" ? row.id : ""))
      .filter(Boolean);

    const sessionIds = [
      ...new Set(
        orderRows
          .map((row) =>
            typeof row.table_session_id === "string" ? row.table_session_id.trim() : "",
          )
          .filter(Boolean),
      ),
    ];

    const [{ data: visitRows }, { data: sessionVisitRows }] = await Promise.all([
      client.from("store_visits").select("order_id").eq("tenant_slug", slug).in("order_id", orderIds),
      sessionIds.length > 0
        ? client
            .from("store_visits")
            .select("table_session_id")
            .eq("tenant_slug", slug)
            .in("table_session_id", sessionIds)
        : Promise.resolve({ data: [] as { table_session_id?: unknown }[] }),
    ]);

    const visitedOrders = new Set(
      ((visitRows as { order_id?: unknown }[] | null) ?? [])
        .map((row) => (typeof row.order_id === "string" ? row.order_id : ""))
        .filter(Boolean),
    );
    const visitedSessions = new Set(
      ((sessionVisitRows as { table_session_id?: unknown }[] | null) ?? [])
        .map((row) => (typeof row.table_session_id === "string" ? row.table_session_id : ""))
        .filter(Boolean),
    );

    const backfilledSessions = new Set<string>();

    for (const row of orderRows) {
      const orderId = typeof row.id === "string" ? row.id : "";
      if (!orderId || visitedOrders.has(orderId)) continue;

      const sessionId =
        typeof row.table_session_id === "string" ? row.table_session_id.trim() : "";
      if (sessionId) {
        if (visitedSessions.has(sessionId) || backfilledSessions.has(sessionId)) continue;
        const paidAt =
          typeof row.completed_at === "string"
            ? row.completed_at
            : typeof row.created_at === "string"
              ? row.created_at
              : new Date().toISOString();
        await recordCompletedTableSessionVisit(client, slug, sessionId, paidAt);
        backfilledSessions.add(sessionId);
        continue;
      }

      await recordCompletedStoreVisit(client, slug, orderId);
    }
  } catch (err) {
    console.error("[backfillMissingStoreVisitsInPeriod]", err);
  }
}

export async function getMerchantTodayGuestSummary(
  tenantSlug: string,
): Promise<MerchantTodayGuestSummary> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "테넌트가 없습니다." };

  const client = createServiceSupabase();
  if (!client) return { ok: false, message: "Supabase 서버 설정이 없습니다." };

  const { sinceIso, untilIso, rangeLabel } = await getTenantCurrentBusinessDayBounds(slug);

  const { data: visitRows, error: visitErr } = await withSupabaseReadRetry(() =>
    client
      .from("store_visits")
      .select("guest_session_id, order_id, table_session_id")
      .eq("tenant_slug", slug)
      .gte("completed_at", sinceIso)
      .lt("completed_at", untilIso),
  );

  if (!visitErr && visitRows) {
    const todaySessions = new Set<string>();
    for (const raw of visitRows as Record<string, unknown>[]) {
      const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
      if (sid.length >= 8) todaySessions.add(sid);
    }
    const paymentFromOrders = await countCompletedGuestPaymentEventsInPeriod(
      client,
      slug,
      sinceIso,
      untilIso,
    );
    const visitPaymentCount = countPaymentEventsFromStoreVisitRows(
      visitRows as Record<string, unknown>[],
    );
    const todayCompletedVisits =
      paymentFromOrders > 0 ? paymentFromOrders : visitPaymentCount;
    return summarizeTodayGuests(
      client,
      slug,
      sinceIso,
      rangeLabel,
      todaySessions,
      todayCompletedVisits,
    );
  }

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("id, guest_session_id, table_session_id")
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .not("guest_session_id", "is", null)
      .or(guestPaidOrdersPeriodOrFilter(sinceIso, untilIso, "lt")),
  );

  if (error && /completed_at|does not exist/i.test(error.message ?? "")) {
    const fallback = await withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("id, guest_session_id, table_session_id")
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .not("guest_session_id", "is", null)
        .gte("created_at", sinceIso)
        .lt("created_at", untilIso),
    );
    if (fallback.error) {
      return { ok: false, message: fallback.error.message ?? "손님 요약을 불러오지 못했습니다." };
    }
    const rows = (fallback.data as Record<string, unknown>[]) ?? [];
    const todaySessions = new Set<string>();
    for (const raw of rows) {
      const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
      if (sid.length >= 8) todaySessions.add(sid);
    }
    return summarizeTodayGuests(
      client,
      slug,
      sinceIso,
      rangeLabel,
      todaySessions,
      countPaymentEventsFromOrderRows(rows),
    );
  }

  if (error) {
    return { ok: false, message: error.message ?? "손님 요약을 불러오지 못했습니다." };
  }

  const rows = (data as Record<string, unknown>[]) ?? [];
  const todaySessions = new Set<string>();
  for (const raw of rows) {
    const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
    if (sid.length >= 8) todaySessions.add(sid);
  }
  return summarizeTodayGuests(
    client,
    slug,
    sinceIso,
    rangeLabel,
    todaySessions,
    countPaymentEventsFromOrderRows(rows),
  );
}

async function summarizeTodayGuests(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  todaySinceIso: string,
  rangeLabel: string,
  todaySessions: Set<string>,
  todayCompletedVisits: number,
): Promise<MerchantTodayGuestSummary> {
  if (todaySessions.size === 0) {
    return {
      ok: true,
      rangeLabel,
      todayCompletedVisits,
      todayFirstVisitGuests: 0,
      todayReturningGuests: 0,
    };
  }

  const sessionList = [...todaySessions];
  const { data: priorRows, error } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("guest_session_id")
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .in("guest_session_id", sessionList)
      .lt("completed_at", todaySinceIso),
  );

  if (error && /completed_at|does not exist/i.test(error.message ?? "")) {
    return {
      ok: true,
      rangeLabel,
      todayCompletedVisits,
      todayFirstVisitGuests: todaySessions.size,
      todayReturningGuests: 0,
    };
  }

  const priorSessions = new Set<string>();
  for (const raw of (priorRows as Record<string, unknown>[]) ?? []) {
    const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
    if (sid) priorSessions.add(sid);
  }

  let todayReturningGuests = 0;
  for (const sid of todaySessions) {
    if (priorSessions.has(sid)) todayReturningGuests += 1;
  }

  return {
    ok: true,
    rangeLabel,
    todayCompletedVisits,
    todayFirstVisitGuests: todaySessions.size - todayReturningGuests,
    todayReturningGuests,
  };
}
