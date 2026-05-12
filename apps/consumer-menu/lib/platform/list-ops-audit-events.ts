import { resolveMerchantAuditDateFilter } from "@/lib/merchant/merchant-audit-date-range";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

export type OpsAuditEventRow = {
  id: string;
  created_at: string;
  tenant_slug: string;
  actor_user_id: string;
  action: string;
  detail: Record<string, unknown>;
};

const PAGE_SIZE = 25;
const MAX_PAGE = 200;
export const OPS_AUDIT_CSV_MAX_ROWS = 5000;

const KNOWN_ACTIONS = new Set([
  "order_status_update",
  "menu_create",
  "menu_update",
  "menu_sold_out_toggle",
  "menu_delete",
]);

const TENANT_SLUG_FILTER = /^[a-z0-9-]{2,120}$/;

export type ListOpsAuditEventsResult =
  | {
      ok: true;
      rows: OpsAuditEventRow[];
      total: number;
      page: number;
      pageSize: number;
    }
  | { ok: false; message: string };

function clampPage(raw: string | undefined): number {
  const n = Number.parseInt(String(raw ?? "1"), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_PAGE);
}

function normalizeActionFilter(raw: string | undefined | null): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  return KNOWN_ACTIONS.has(s) ? s : null;
}

export function normalizeOpsAuditTenantSlug(
  raw: string | null | undefined,
): { ok: true; slug: string | null } | { ok: false; message: string } {
  const t = String(raw ?? "").trim().toLowerCase();
  if (!t) return { ok: true, slug: null };
  if (!TENANT_SLUG_FILTER.test(t)) {
    return {
      ok: false,
      message: "매장 슬러그는 영문 소문자·숫자·하이픈만, 2~120자이거나 비워 주세요.",
    };
  }
  return { ok: true, slug: t };
}

function mapRows(data: unknown[] | null): OpsAuditEventRow[] {
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const detailRaw = row.detail;
    const detail =
      detailRaw && typeof detailRaw === "object" && !Array.isArray(detailRaw)
        ? (detailRaw as Record<string, unknown>)
        : {};
    return {
      id: String(row.id ?? ""),
      created_at: String(row.created_at ?? ""),
      tenant_slug: String(row.tenant_slug ?? ""),
      actor_user_id: String(row.actor_user_id ?? ""),
      action: String(row.action ?? ""),
      detail,
    };
  });
}

/**
 * 플랫폼 운영자 세션 + RLS(`merchant_audit_events_select_platform_operator`) 로 전 매장 감사 로그 조회.
 */
export async function listOpsAuditEvents(input: {
  tenantSlug?: string | null | undefined;
  page?: string | null | undefined;
  action?: string | null | undefined;
  fromYmd?: string | null | undefined;
  toYmd?: string | null | undefined;
}): Promise<ListOpsAuditEventsResult> {
  const tenantNorm = normalizeOpsAuditTenantSlug(input.tenantSlug);
  if (!tenantNorm.ok) {
    return { ok: false, message: tenantNorm.message };
  }

  const dateRes = resolveMerchantAuditDateFilter(input.fromYmd, input.toYmd);
  if (dateRes.kind === "error") {
    return { ok: false, message: dateRes.message };
  }

  const page = clampPage(typeof input.page === "string" ? input.page : undefined);
  const actionFilter = normalizeActionFilter(typeof input.action === "string" ? input.action : null);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase 서버 클라이언트를 만들 수 없습니다." };
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supabase
    .from("merchant_audit_events")
    .select("id, created_at, tenant_slug, actor_user_id, action, detail", { count: "exact" })
    .order("created_at", { ascending: false });

  if (tenantNorm.slug) {
    q = q.eq("tenant_slug", tenantNorm.slug);
  }
  if (dateRes.kind === "range") {
    q = q.gte("created_at", dateRes.range.gteIso).lt("created_at", dateRes.range.ltIso);
  }
  if (actionFilter) {
    q = q.eq("action", actionFilter);
  }

  const { data, error, count } = await q.range(from, to);

  if (error) {
    return {
      ok: false,
      message: `감사 로그를 불러오지 못했습니다. (${error.code ?? "unknown"})`,
    };
  }

  const rows = mapRows(data as unknown[] | null);

  return {
    ok: true,
    rows,
    total: typeof count === "number" ? count : rows.length,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function fetchOpsAuditEventsForExport(input: {
  tenantSlug?: string | null | undefined;
  action?: string | null;
  fromYmd?: string | null;
  toYmd?: string | null;
}): Promise<
  { ok: true; rows: OpsAuditEventRow[]; truncated: boolean } | { ok: false; message: string }
> {
  const tenantNorm = normalizeOpsAuditTenantSlug(input.tenantSlug);
  if (!tenantNorm.ok) {
    return { ok: false, message: tenantNorm.message };
  }

  const dateRes = resolveMerchantAuditDateFilter(input.fromYmd, input.toYmd);
  if (dateRes.kind === "error") {
    return { ok: false, message: dateRes.message };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase 서버 클라이언트를 만들 수 없습니다." };
  }

  const actionFilter = normalizeActionFilter(typeof input.action === "string" ? input.action : null);

  let q = supabase
    .from("merchant_audit_events")
    .select("id, created_at, tenant_slug, actor_user_id, action, detail")
    .order("created_at", { ascending: false });

  if (tenantNorm.slug) {
    q = q.eq("tenant_slug", tenantNorm.slug);
  }
  if (dateRes.kind === "range") {
    q = q.gte("created_at", dateRes.range.gteIso).lt("created_at", dateRes.range.ltIso);
  }
  if (actionFilter) {
    q = q.eq("action", actionFilter);
  }

  const { data, error } = await q.limit(OPS_AUDIT_CSV_MAX_ROWS + 1);

  if (error) {
    return {
      ok: false,
      message: `감사 로그를 불러오지 못했습니다. (${error.code ?? "unknown"})`,
    };
  }

  const raw = (data ?? []) as unknown[];
  const truncated = raw.length > OPS_AUDIT_CSV_MAX_ROWS;
  const sliced = truncated ? raw.slice(0, OPS_AUDIT_CSV_MAX_ROWS) : raw;
  return { ok: true, rows: mapRows(sliced), truncated };
}
