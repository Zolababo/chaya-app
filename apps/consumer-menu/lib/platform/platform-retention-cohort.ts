import "server-only";

import { listPlatformStores } from "@/lib/platform/list-platform-stores";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

const KST = "Asia/Seoul";

export type RetentionCohortRow = {
  cohortMonth: string;
  size: number;
  /** 1~4개월차 활성 유지율(%) — 아직 해당 월이 지나지 않으면 null */
  months: [number | null, number | null, number | null, number | null];
};

export type PlatformRetentionCohortResult =
  | { ok: true; rows: RetentionCohortRow[] }
  | { ok: false; message: string };

function cohortKey(iso: string | null): string | null {
  if (!iso || iso.length < 7) return null;
  return iso.slice(0, 7);
}

function orderMonthKey(iso: string): string | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toLocaleDateString("en-CA", { timeZone: KST }).slice(0, 7);
}

function addMonths(yyyyMm: string, offset: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatCohortLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-");
  return `${y}.${m}`;
}

function retentionPct(active: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((active / total) * 100);
}

function cellClass(pct: number): "high" | "mid" | "low" {
  if (pct >= 80) return "high";
  if (pct >= 65) return "mid";
  return "low";
}

export function retentionCellClass(pct: number): "high" | "mid" | "low" {
  return cellClass(pct);
}

/** 가입월 코호트 · 이후 달 주문 발생 매장 비율 */
export async function getPlatformRetentionCohorts(): Promise<PlatformRetentionCohortResult> {
  const storesRes = await listPlatformStores();
  if (!storesRes.ok) {
    return { ok: false, message: storesRes.message };
  }

  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "Supabase 서버 설정(SERVICE_ROLE)이 없습니다." };
  }

  const cohortMembers = new Map<string, string[]>();
  for (const s of storesRes.stores) {
    const key = cohortKey(s.firstMemberAt);
    if (!key) continue;
    const list = cohortMembers.get(key) ?? [];
    list.push(s.tenantSlug);
    cohortMembers.set(key, list);
  }

  const cohortKeys = [...cohortMembers.keys()].sort().slice(-4);
  if (cohortKeys.length === 0) {
    return { ok: true, rows: [] };
  }

  const earliest = cohortKeys[0]!;
  const sinceIso = new Date(`${earliest}-01T00:00:00+09:00`).toISOString();

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("tenant_slug, created_at, status")
      .gte("created_at", sinceIso)
      .neq("status", "cancelled")
      .limit(8000),
  );

  if (error) {
    return { ok: false, message: error.message ?? "주문 이력을 불러오지 못했습니다." };
  }

  const tenantOrderMonths = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const slug = typeof row.tenant_slug === "string" ? row.tenant_slug.trim() : "";
    const created = typeof row.created_at === "string" ? row.created_at : "";
    const mk = orderMonthKey(created);
    if (!slug || !mk) continue;
    const set = tenantOrderMonths.get(slug) ?? new Set<string>();
    set.add(mk);
    tenantOrderMonths.set(slug, set);
  }

  const nowMonth = new Date().toLocaleDateString("en-CA", { timeZone: KST }).slice(0, 7);

  const rows: RetentionCohortRow[] = cohortKeys.map((cohort) => {
    const members = cohortMembers.get(cohort) ?? [];
    const months: RetentionCohortRow["months"] = [null, null, null, null];

    for (let i = 0; i < 4; i += 1) {
      const targetMonth = addMonths(cohort, i + 1);
      if (targetMonth > nowMonth) continue;

      let active = 0;
      for (const slug of members) {
        const orderMonths = tenantOrderMonths.get(slug);
        if (orderMonths?.has(targetMonth)) active += 1;
      }
      months[i] = retentionPct(active, members.length);
    }

    return {
      cohortMonth: formatCohortLabel(cohort),
      size: members.length,
      months,
    };
  });

  return { ok: true, rows };
}
