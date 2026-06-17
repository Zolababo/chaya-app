import { NextResponse } from "next/server";

import {
  buildMerchantAnalyticsRequest,
  type MerchantAnalyticsQueryParams,
} from "@/lib/merchant/merchant-analytics-request";
import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";
import { getMerchantAnalytics } from "@/lib/orders/merchant-analytics";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ tenant: string }> };

/** 점주 분석 — 기간별 집계 (클라이언트 캐시용) */
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
  const snapshot = await getMerchantAnalytics(auth.slug, req);

  if (!snapshot.ok) {
    return NextResponse.json({ ok: false, message: snapshot.message }, MERCHANT_LIVE_JSON_HEADERS);
  }

  return NextResponse.json({ ok: true, snapshot }, MERCHANT_LIVE_JSON_HEADERS);
}
