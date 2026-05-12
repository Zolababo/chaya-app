import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

export type MerchantNotificationRow = {
  id: string;
  created_at: string;
  kind: string;
  summary: string;
  email_status: string;
};

/**
 * 세션 + RLS 로 해당 매장 최근 알림을 읽습니다.
 */
export async function listRecentMerchantNotificationEvents(
  tenantSlug: string,
  limit = 8,
): Promise<{ ok: true; rows: MerchantNotificationRow[] } | { ok: false; message: string }> {
  const tenant = tenantSlug.trim();
  if (!tenant) {
    return { ok: false, message: "테넌트가 없습니다." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase 클라이언트를 만들 수 없습니다." };
  }

  const lim = Math.max(1, Math.min(30, Math.floor(limit)));

  const { data, error } = await supabase
    .from("merchant_notification_events")
    .select("id, created_at, kind, summary, email_status")
    .eq("tenant_slug", tenant)
    .order("created_at", { ascending: false })
    .limit(lim);

  if (error) {
    return {
      ok: false,
      message: `알림을 불러오지 못했습니다. (${error.code ?? "unknown"})`,
    };
  }

  const rows: MerchantNotificationRow[] = (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      created_at: String(row.created_at ?? ""),
      kind: String(row.kind ?? ""),
      summary: String(row.summary ?? ""),
      email_status: String(row.email_status ?? ""),
    };
  });

  return { ok: true, rows };
}
