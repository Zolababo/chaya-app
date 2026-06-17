import { NextResponse } from "next/server";

import { listPlatformAnnouncementsForMerchant } from "@/lib/merchant/list-platform-announcements";
import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ tenant: string }> };

/** 점주앱 공지 피드 — 헤더 벨·공지 목록 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { tenant } = await params;
  const auth = await requireMerchantLiveJsonAccess(tenant);
  if (auth instanceof NextResponse) return auth;

  const result = await listPlatformAnnouncementsForMerchant(auth.slug, 30);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: 500, ...MERCHANT_LIVE_JSON_HEADERS },
    );
  }

  return NextResponse.json({ ok: true, items: result.items }, MERCHANT_LIVE_JSON_HEADERS);
}
