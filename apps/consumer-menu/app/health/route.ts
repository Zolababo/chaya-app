import { NextResponse } from "next/server";

/** 배포·모니터링용 헬스 체크 (인증 없음). 값 자체는 노출하지 않고 설정 여부만 반환합니다. */
export function GET() {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasSupabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

  const res = NextResponse.json(
    {
      ok: true,
      service: "consumer-menu",
      ts: new Date().toISOString(),
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
