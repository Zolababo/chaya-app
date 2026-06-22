import { NextResponse } from "next/server";

import { buildMerchantMoreSnapshot } from "@/lib/merchant/build-merchant-more-snapshot";
import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ tenant: string }> };

/** 더보기 허브 — SPA 오버레이용 JSON */
export async function GET(_request: Request, { params }: RouteParams) {
  const { tenant } = await params;
  const auth = await requireMerchantLiveJsonAccess(tenant);
  if (auth instanceof NextResponse) return auth;

  const snapshot = await buildMerchantMoreSnapshot(auth.slug, auth.role);
  return NextResponse.json({ ok: true, snapshot }, MERCHANT_LIVE_JSON_HEADERS);
}
