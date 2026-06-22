import { NextResponse } from "next/server";

import {
  buildMerchantAnalyticsRequest,
  type MerchantAnalyticsQueryParams,
} from "@/lib/merchant/merchant-analytics-request";
import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";
import { getMerchantGuestInsights } from "@/lib/merchant/merchant-guest-insights";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ tenant: string }> };

/** 점주 분석 — 손님·재방문 집계 (매출 분석과 동일 기간 파라미터) */
export async function GET(request: Request, { params }: RouteParams) {
  const { tenant } = await params;
  const auth = await requireMerchantLiveJsonAccess(tenant);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const query: MerchantAnalyticsQueryParams = {
    days: url.searchParams.get("days") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    month: url.searchParams.get("month") ?? undefined,
    lastmonth: url.searchParams.get("lastmonth") ?? undefined,
  };

  const { req } = buildMerchantAnalyticsRequest(query);
  const snapshot = await getMerchantGuestInsights(auth.slug, req);

  if (!snapshot.ok) {
    return NextResponse.json({ ok: false, message: snapshot.message }, MERCHANT_LIVE_JSON_HEADERS);
  }

  return NextResponse.json({ ok: true, snapshot }, MERCHANT_LIVE_JSON_HEADERS);
}
