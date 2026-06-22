import "server-only";

import { formatGuestItemsBrief } from "@/lib/merchant/format-guest-last-visit";
import { GUEST_REGULAR_MIN_PRIOR } from "@/lib/merchant/guest-visit-policy";
import { parseOrderLineSummaries } from "@/lib/orders/format-order-line-summary";
import {
  getKstCalendarDayBounds,
  resolveMerchantAnalyticsTimeBounds,
  type MerchantAnalyticsRequest,
} from "@/lib/orders/merchant-analytics";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

const GUEST_LIST_TOP = 8;

export type MerchantGuestListRow = {
  visitCountInPeriod: number;
  lifetimeVisitCount: number;
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
    if (a.visitCountInPeriod !== b.visitCountInPeriod) {
      return b.visitCountInPeriod - a.visitCountInPeriod;
    }
    return b.periodSpend - a.periodSpend;
  });
}

export async function getMerchantGuestInsights(
  tenantSlug: string,
  req: MerchantAnalyticsRequest,
): Promise<MerchantGuestInsightsSnapshot> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "테넌트가 없습니다." };

  const bounds = resolveMerchantAnalyticsTimeBounds(req);
  if (!bounds.ok) return { ok: false, message: bounds.message };

  const { sinceIso, untilIso, periodLabel } = bounds;

  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "Supabase 서버 설정이 없습니다." };
  }

  const { data: periodVisits, error: visitErr } = await withSupabaseReadRetry(() =>
    client
      .from("store_visits")
      .select("guest_session_id, completed_at, total_price, items")
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
  };
  const periodBySession = new Map<string, PeriodAcc>();

  for (const raw of periodRows) {
    const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
    if (sid.length < 8) continue;
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
    };
    acc.visitCountInPeriod += 1;
    acc.periodSpend += parsePrice(raw.total_price);
    if (at > acc.lastCompletedAt) {
      acc.lastCompletedAt = at;
      acc.lastItems = raw.items;
    }
    periodBySession.set(sid, acc);
  }

  if (periodBySession.size === 0) {
    return {
      ok: true,
      periodLabel,
      completedVisits: periodRows.length,
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
    return buildGuestSnapshotFromPeriodMap(periodBySession, periodLabel, periodRows.length, null);
  }
  if (rollupErr) {
    return { ok: false, message: rollupErr.message ?? "손님 데이터를 불러오지 못했습니다." };
  }

  const rollupBySession = new Map<string, Record<string, unknown>>();
  for (const raw of (rollupRows as Record<string, unknown>[]) ?? []) {
    const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
    if (sid) rollupBySession.set(sid, raw);
  }

  return buildGuestSnapshotFromPeriodMap(
    periodBySession,
    periodLabel,
    periodRows.length,
    rollupBySession,
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
): MerchantGuestInsightsSnapshot {
  const guests: MerchantGuestListRow[] = [];
  let returningGuests = 0;
  let regularGuests = 0;

  for (const [, acc] of periodBySession) {
    const rollup = rollupBySession
      ? [...periodBySession.keys()].map((sid) => ({ sid, rollup: rollupBySession.get(sid) }))
      : [];
    void rollup;
  }

  for (const [sid, acc] of periodBySession) {
    const raw = rollupBySession?.get(sid);
    const lifetimeVisitCount = raw
      ? Number(raw.completed_visit_count) || acc.visitCountInPeriod
      : acc.visitCountInPeriod;
    const isReturning = lifetimeVisitCount >= 2;
    const isRegular = lifetimeVisitCount >= GUEST_REGULAR_MIN_PRIOR + 1;
    if (isReturning) returningGuests += 1;
    if (isRegular) regularGuests += 1;

    const items = raw?.last_items ?? acc.lastItems;
    guests.push({
      visitCountInPeriod: acc.visitCountInPeriod,
      lifetimeVisitCount,
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
      .select("guest_session_id, total_price, completed_at, created_at, items")
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .not("guest_session_id", "is", null)
      .gte("completed_at", sinceIso)
      .lte("completed_at", untilIso)
      .order("completed_at", { ascending: false }),
  );
  let data: Record<string, unknown>[] | null =
    (first.data as Record<string, unknown>[] | null) ?? null;
  const error = first.error;

  if (error && /completed_at|does not exist/i.test(error.message ?? "")) {
    const fallback = await withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("guest_session_id, total_price, created_at, items")
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
  };
  const bySession = new Map<string, Acc>();
  let completedVisits = 0;

  for (const row of data ?? []) {
    const sid = typeof row.guest_session_id === "string" ? row.guest_session_id.trim() : "";
    if (sid.length < 8) continue;
    const at =
      typeof row.completed_at === "string"
        ? row.completed_at
        : typeof row.created_at === "string"
          ? row.created_at
          : "";
    if (!at) continue;
    completedVisits += 1;
    const acc = bySession.get(sid) ?? {
      visitCountInPeriod: 0,
      periodSpend: 0,
      lastCompletedAt: at,
      lastItems: row.items,
    };
    acc.visitCountInPeriod += 1;
    acc.periodSpend += parsePrice(row.total_price);
    if (at > acc.lastCompletedAt) {
      acc.lastCompletedAt = at;
      acc.lastItems = row.items;
    }
    bySession.set(sid, acc);
  }

  return buildGuestSnapshotFromPeriodMap(bySession, label, completedVisits, null);
}

export async function getMerchantTodayGuestSummary(
  tenantSlug: string,
): Promise<MerchantTodayGuestSummary> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "테넌트가 없습니다." };

  const client = createServiceSupabase();
  if (!client) return { ok: false, message: "Supabase 서버 설정이 없습니다." };

  const { sinceIso, untilIso } = getKstCalendarDayBounds();

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("guest_session_id")
      .eq("tenant_slug", slug)
      .eq("status", "completed")
      .not("guest_session_id", "is", null)
      .gte("completed_at", sinceIso)
      .lt("completed_at", untilIso),
  );

  if (error && /completed_at|does not exist/i.test(error.message ?? "")) {
    const fallback = await withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("guest_session_id")
        .eq("tenant_slug", slug)
        .eq("status", "completed")
        .not("guest_session_id", "is", null)
        .gte("created_at", sinceIso)
        .lt("created_at", untilIso),
    );
    if (fallback.error) {
      return { ok: false, message: fallback.error.message ?? "손님 요약을 불러오지 못했습니다." };
    }
    return summarizeTodayGuests(client, slug, sinceIso, fallback.data as Record<string, unknown>[]);
  }

  if (error) {
    return { ok: false, message: error.message ?? "손님 요약을 불러오지 못했습니다." };
  }

  return summarizeTodayGuests(client, slug, sinceIso, (data as Record<string, unknown>[]) ?? []);
}

async function summarizeTodayGuests(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  slug: string,
  todaySinceIso: string,
  todayRows: Record<string, unknown>[],
): Promise<MerchantTodayGuestSummary> {
  const todaySessions = new Set<string>();
  for (const raw of todayRows) {
    const sid = typeof raw.guest_session_id === "string" ? raw.guest_session_id.trim() : "";
    if (sid.length >= 8) todaySessions.add(sid);
  }

  if (todaySessions.size === 0) {
    return {
      ok: true,
      todayCompletedVisits: todayRows.length,
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
      todayCompletedVisits: todayRows.length,
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
    todayCompletedVisits: todayRows.length,
    todayFirstVisitGuests: todaySessions.size - todayReturningGuests,
    todayReturningGuests,
  };
}
