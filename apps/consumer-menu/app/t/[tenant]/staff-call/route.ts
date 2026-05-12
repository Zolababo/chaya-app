import { NextResponse } from "next/server";

import { CONSUMER_STAFF_CALL_IMPLEMENTED } from "@/lib/consumer/future-features";

/**
 * 직원 호출 — **구조만**. 연동 전까지 POST 는 501.
 * (프론트에 비밀키 없이, 향후 서버에서 알림/PG만 붙이면 됨.)
 */
export async function POST() {
  if (!CONSUMER_STAFF_CALL_IMPLEMENTED) {
    return NextResponse.json(
      { error: "not_implemented", message: "직원 호출은 아직 연결되지 않았습니다." },
      { status: 501 },
    );
  }

  return NextResponse.json({ error: "not_implemented" }, { status: 501 });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
