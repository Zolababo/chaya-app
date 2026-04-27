import { NextResponse } from "next/server";

/** 배포·모니터링용 헬스 체크 (인증 없음). */
export function GET() {
  return NextResponse.json(
    { ok: true, service: "consumer-menu", ts: new Date().toISOString() },
    { status: 200 },
  );
}
