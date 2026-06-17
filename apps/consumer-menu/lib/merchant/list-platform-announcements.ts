import {
  parsePlatformAnnouncement,
  type PlatformAnnouncement,
} from "@/lib/merchant/platform-announcement";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

export async function listPlatformAnnouncementsForMerchant(
  tenantSlug: string,
  limit = 30,
): Promise<{ ok: true; items: PlatformAnnouncement[] } | { ok: false; message: string }> {
  const tenant = tenantSlug.trim();
  if (!tenant) {
    return { ok: false, message: "테넌트가 없습니다." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase 클라이언트를 만들 수 없습니다." };
  }

  const lim = Math.max(1, Math.min(50, Math.floor(limit)));

  const { data, error } = await supabase
    .from("merchant_notification_events")
    .select("id, created_at, kind, summary, payload")
    .eq("tenant_slug", tenant)
    .eq("kind", "platform_announcement")
    .order("created_at", { ascending: false })
    .limit(lim);

  if (error) {
    return {
      ok: false,
      message: `공지를 불러오지 못했습니다. (${error.code ?? "unknown"})`,
    };
  }

  const items = (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return parsePlatformAnnouncement({
      id: String(r.id ?? ""),
      created_at: String(r.created_at ?? ""),
      summary: String(r.summary ?? ""),
      payload: r.payload,
    });
  });

  return { ok: true, items };
}
