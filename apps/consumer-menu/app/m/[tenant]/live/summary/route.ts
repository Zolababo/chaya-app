import { NextResponse } from "next/server";

import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";
import { getMerchantPendingCountQuick } from "@/lib/orders/merchant-quick-counts";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ tenant: string }> };

/** 점주앱 라이브 뱃지·폴링 — pending 1쿼리만 (가벼움) */
export async function GET(_request: Request, { params }: RouteParams) {
  const { tenant } = await params;
  const auth = await requireMerchantLiveJsonAccess(tenant);
  if (auth instanceof NextResponse) return auth;

  const pending = await getMerchantPendingCountQuick(auth.slug);
  if (pending == null) {
    return NextResponse.json({ error: "count_failed" }, { status: 500, ...MERCHANT_LIVE_JSON_HEADERS });
  }

  return NextResponse.json({ pending }, MERCHANT_LIVE_JSON_HEADERS);
}
