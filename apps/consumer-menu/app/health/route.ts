import { NextResponse } from "next/server";

/** 배포·모니터링용 헬스 체크 (인증 없음). Supabase URL·키 값은 노출하지 않습니다. */
export function GET() {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasSupabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

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
      },
    },
    { status: 200 },
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}
