import { NextResponse } from "next/server";

import {
  getSupabaseServiceRoleKey,
  getSupabaseServiceUrl,
  isServiceSupabaseConfigured,
} from "@/lib/supabase/resolve-service-config";

/** 배포·모니터링용 헬스 체크 (인증 없음). Supabase URL·키 값은 노출하지 않습니다. */
export function GET() {
  const publicUrl = getSupabaseServiceUrl();
  const hasSupabaseUrl = Boolean(publicUrl);
  const hasSupabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const serviceRoleSecret = getSupabaseServiceRoleKey();

  const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() ?? null;
  const vercelEnv = process.env.VERCEL_ENV?.trim() ?? null;

  const res = NextResponse.json(
    {
      ok: true,
      service: "consumer-menu",
      ts: new Date().toISOString(),
      deployment: vercelSha || vercelEnv ? { env: vercelEnv, gitCommitSha: vercelSha } : undefined,
      supabase: {
        configured: hasSupabaseUrl && hasSupabaseAnon,
        hasUrl: hasSupabaseUrl,
        hasAnonKey: hasSupabaseAnon,
        /** 점주 `/m/*` DB 접근(주문·메뉴). URL+service_role 둘 다 있어야 true (비밀 값은 미포함). */
        merchantDbReady: isServiceSupabaseConfigured(),
        merchantDb: {
          hasProjectUrl: hasSupabaseUrl,
          hasServiceRoleKey: Boolean(serviceRoleSecret),
        },
      },
    },
    { status: 200 },
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}
