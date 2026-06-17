import "server-only";

import { getKstCalendarDayBounds } from "@/lib/orders/merchant-analytics";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetryResult } from "@/lib/supabase/transient-retry";

const KST = "Asia/Seoul";

export type PlatformQrTrafficSnapshot =
  | {
      ok: true;
      monthVisits: number;
      todayVisits: number;
      prevMonthVisits: number;
      monthChangePct: number | null;
      activeTables: number;
      hasData: boolean;
    }
  | { ok: false; message: string };

function monthStartKey(nowMs = Date.now()): string {
  const today = new Date(nowMs).toLocaleDateString("en-CA", { timeZone: KST });
  return `${today.slice(0, 7)}-01`;
}

function prevMonthStartKey(nowMs = Date.now()): string {
  const today = new Date(nowMs).toLocaleDateString("en-CA", { timeZone: KST });
  const [y, mo] = today.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function getPlatformQrTraffic(
  activeTableCount: number,
): Promise<PlatformQrTrafficSnapshot> {
  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "Supabase 서버 설정(SERVICE_ROLE)이 없습니다." };
  }

  const { dateKey } = getKstCalendarDayBounds();
  const monthStart = monthStartKey();
  const prevMonthStart = prevMonthStartKey();
  const prevMonthEnd = monthStart;

  const [monthRes, todayRes, prevRes] = await Promise.all([
    withSupabaseReadRetryResult(() =>
      client
        .from("tenant_qr_visits")
        .select("id", { count: "exact", head: true })
        .gte("day_key", monthStart),
    ),
    withSupabaseReadRetryResult(() =>
      client
        .from("tenant_qr_visits")
        .select("id", { count: "exact", head: true })
        .eq("day_key", dateKey),
    ),
    withSupabaseReadRetryResult(() =>
      client
        .from("tenant_qr_visits")
        .select("id", { count: "exact", head: true })
        .gte("day_key", prevMonthStart)
        .lt("day_key", prevMonthEnd),
    ),
  ]);

  if (monthRes.error) {
    const msg = monthRes.error.message ?? "";
    if (msg.includes("tenant_qr_visits") || monthRes.error.code === "42P01") {
      return {
        ok: true,
        monthVisits: 0,
        todayVisits: 0,
        prevMonthVisits: 0,
        monthChangePct: null,
        activeTables: activeTableCount,
        hasData: false,
      };
    }
    return { ok: false, message: msg || "QR 접속 집계를 불러오지 못했습니다." };
  }

  const monthVisits = monthRes.count ?? 0;
  const todayVisits = todayRes.count ?? 0;
  const prevMonthVisits = prevRes.count ?? 0;
  const monthChangePct =
    prevMonthVisits > 0
      ? Math.round(((monthVisits - prevMonthVisits) / prevMonthVisits) * 100)
      : monthVisits > 0
        ? 100
        : null;

  return {
    ok: true,
    monthVisits,
    todayVisits,
    prevMonthVisits,
    monthChangePct,
    activeTables: activeTableCount,
    hasData: true,
  };
}
