import { resolveMerchantAuditDateFilter } from "@/lib/merchant/merchant-audit-date-range";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

export type MerchantAuditEventRow = {
  id: string;
  created_at: string;
  tenant_slug: string;
  actor_user_id: string;
  action: string;
  detail: Record<string, unknown>;
};

const PAGE_SIZE = 25;
const MAX_PAGE = 200;
export const MERCHANT_AUDIT_CSV_MAX_ROWS = 5000;

const KNOWN_ACTIONS = new Set([
  "order_status_update",
  "menu_create",
  "menu_update",
  "menu_sold_out_toggle",
  "menu_delete",
]);

export type ListMerchantAuditEventsResult =
  | {
      ok: true;
      rows: MerchantAuditEventRow[];
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

function mapAuditRows(data: unknown[] | null): MerchantAuditEventRow[] {
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
 * 세션(authenticated) + RLS 로 해당 테넌트 감사 이벤트를 읽습니다.
 */
export async function listMerchantAuditEvents(input: {
  tenantSlug: string;
  page?: string | undefined | null;
  action?: string | undefined | null;
  fromYmd?: string | null | undefined;
  toYmd?: string | null | undefined;
}): Promise<ListMerchantAuditEventsResult> {
  const tenant = input.tenantSlug.trim();
  if (!tenant) {
    return { ok: false, message: "테넌트가 없습니다." };
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
    .eq("tenant_slug", tenant)
    .order("created_at", { ascending: false });

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

  const rows = mapAuditRows(data as unknown[] | null);

  return {
    ok: true,
    rows,
    total: typeof count === "number" ? count : rows.length,
    page,
    pageSize: PAGE_SIZE,
  };
}

/**
 * CSV용. 최대 `MERCHANT_AUDIT_CSV_MAX_ROWS` + 1 건 조회해 초과 여부를 판별합니다.
 */
export async function fetchMerchantAuditEventsForExport(input: {
  tenantSlug: string;
  action?: string | null;
  fromYmd?: string | null;
  toYmd?: string | null;
}): Promise<
  { ok: true; rows: MerchantAuditEventRow[]; truncated: boolean } | { ok: false; message: string }
> {
  const tenant = input.tenantSlug.trim();
  if (!tenant) {
    return { ok: false, message: "테넌트가 없습니다." };
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
    .eq("tenant_slug", tenant)
    .order("created_at", { ascending: false });

  if (dateRes.kind === "range") {
    q = q.gte("created_at", dateRes.range.gteIso).lt("created_at", dateRes.range.ltIso);
  }
  if (actionFilter) {
    q = q.eq("action", actionFilter);
  }

  const { data, error } = await q.limit(MERCHANT_AUDIT_CSV_MAX_ROWS + 1);

  if (error) {
    return {
      ok: false,
      message: `감사 로그를 불러오지 못했습니다. (${error.code ?? "unknown"})`,
    };
  }

  const raw = (data ?? []) as unknown[];
  const truncated = raw.length > MERCHANT_AUDIT_CSV_MAX_ROWS;
  const sliced = truncated ? raw.slice(0, MERCHANT_AUDIT_CSV_MAX_ROWS) : raw;
  return { ok: true, rows: mapAuditRows(sliced), truncated };
}

export function merchantAuditActionLabel(action: string): string {
  switch (action) {
    case "order_status_update":
      return "주문 상태 변경";
    case "menu_create":
      return "메뉴 추가";
    case "menu_update":
      return "메뉴 수정";
    case "menu_sold_out_toggle":
      return "품절 여부 변경";
    case "menu_delete":
      return "메뉴 삭제";
    case "ops.kakao_alimtalk_link":
      return "카카오 알림톡 연동 (운영)";
    case "ops.kakao_alimtalk_unlink":
      return "카카오 알림톡 해제 (운영)";
    case "ops.store_announcement":
      return "매장 공지 발송 (운영)";
    case "ops.orders_accepting_on":
      return "주문 접수 재개 (운영)";
    case "ops.orders_accepting_off":
      return "주문 접수 정지 (운영)";
    case "ops.billing_plan_set":
      return "요금 플랜 변경 (운영)";
    case "ops.orders_reset":
      return "주문 데이터 초기화 (운영)";
    default:
      return action || "기타";
  }
}

export const MERCHANT_AUDIT_ACTION_FILTERS = [
  { value: "", label: "전체" },
  { value: "order_status_update", label: "주문 상태 변경" },
  { value: "menu_create", label: "메뉴 추가" },
  { value: "menu_update", label: "메뉴 수정" },
  { value: "menu_sold_out_toggle", label: "품절 여부" },
  { value: "menu_delete", label: "메뉴 삭제" },
] as const;
