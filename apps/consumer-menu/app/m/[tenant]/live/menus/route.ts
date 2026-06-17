import { NextResponse } from "next/server";

import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";
import { canManageMerchantMenus } from "@/lib/merchant/merchant-role-capabilities";
import { listMenusForMerchant } from "@/lib/menus/list-menus-for-merchant";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ tenant: string }> };

/** 점주 메뉴 목록 — 클라이언트 캐시·탭 왕복용 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { tenant } = await params;
  const auth = await requireMerchantLiveJsonAccess(tenant);
  if (auth instanceof NextResponse) return auth;

  if (!canManageMerchantMenus(auth.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, ...MERCHANT_LIVE_JSON_HEADERS });
  }

  const result = await listMenusForMerchant(auth.slug);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, MERCHANT_LIVE_JSON_HEADERS);
  }

  return NextResponse.json({ ok: true, items: result.items }, MERCHANT_LIVE_JSON_HEADERS);
}
