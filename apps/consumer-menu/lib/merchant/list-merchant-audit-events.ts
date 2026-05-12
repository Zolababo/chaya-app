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

/**
 * 세션(authenticated) + RLS 로 해당 테넌트 감사 이벤트를 읽습니다.
 */
export async function listMerchantAuditEvents(input: {
  tenantSlug: string;
  page?: string | undefined | null;
  action?: string | undefined | null;
}): Promise<ListMerchantAuditEventsResult> {
  const tenant = input.tenantSlug.trim();
  if (!tenant) {
    return { ok: false, message: "테넌트가 없습니다." };
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

  const rows: MerchantAuditEventRow[] = (data ?? []).map((r) => {
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

  return {
    ok: true,
    rows,
    total: typeof count === "number" ? count : rows.length,
    page,
    pageSize: PAGE_SIZE,
  };
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
