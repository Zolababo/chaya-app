import { NextResponse } from "next/server";

import { CONSUMER_CHECKOUT_PAYMENT_IMPLEMENTED } from "@/lib/consumer/future-features";

/**
 * 결제 준비/의도 — **구조만**(손님 UI 미노출). PG 연동 전까지 POST 는 501.
 * 제품 정책: 당분간 카운터 오프라인 결제. 구현 시 `CONSUMER_CHECKOUT_PAYMENT_UI_VISIBLE`·`CONSUMER_CHECKOUT_PAYMENT_IMPLEMENTED` 참고.
 */
export async function POST() {
  if (!CONSUMER_CHECKOUT_PAYMENT_IMPLEMENTED) {
    return NextResponse.json(
      { error: "not_implemented", message: "결제 단계는 아직 연결되지 않았습니다." },
      { status: 501 },
    );
  }

  return NextResponse.json({ error: "not_implemented" }, { status: 501 });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
