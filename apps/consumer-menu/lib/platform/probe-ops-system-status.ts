import "server-only";

import { isServiceSupabaseConfigured } from "@/lib/supabase/resolve-service-config";

export type OpsSystemProbe = {
  apiOk: boolean;
  apiDetail: string;
  dbOk: boolean;
  dbDetail: string;
  cdnOk: boolean;
  cdnDetail: string;
  pushOk: boolean;
  pushDetail: string;
};

/** `/health` JSON 기반 — 설정 패널용 (비밀값 미포함) */
export async function probeOpsSystemStatus(siteOrigin: string): Promise<OpsSystemProbe> {
  let health: Record<string, unknown> | null = null;
  try {
    const res = await fetch(`${siteOrigin.replace(/\/$/, "")}/health`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (res.ok) {
      health = (await res.json()) as Record<string, unknown>;
    }
  } catch {
    health = null;
  }

  const supabase = (health?.supabase ?? {}) as Record<string, unknown>;
  const merchantDb = (supabase.merchantDb ?? {}) as Record<string, unknown>;
  const webPush = (supabase.merchantWebPush ?? {}) as Record<string, unknown>;
  const email = (supabase.merchantOrderEmail ?? {}) as Record<string, unknown>;

  const dbReady =
    Boolean(supabase.merchantDbReady) ||
    (Boolean(merchantDb.hasProjectUrl) && Boolean(merchantDb.hasServiceRoleKey)) ||
    isServiceSupabaseConfigured();

  return {
    apiOk: health?.ok === true,
    apiDetail: health?.ok === true ? "응답 정상" : "헬스 조회 실패",
    dbOk: dbReady,
    dbDetail: dbReady ? "RLS · service role" : "URL/키 확인 필요",
    cdnOk: true,
    cdnDetail: "Vercel Edge",
    pushOk: Boolean(webPush.vapidConfigured),
    pushDetail: webPush.vapidConfigured
      ? "VAPID 설정됨"
      : email.resendConfigured
        ? "Resend만 설정 · 푸시 미설정"
        : "푸시·메일 준비 중",
  };
}
