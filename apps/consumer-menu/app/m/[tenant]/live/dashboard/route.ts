import { NextResponse } from "next/server";

import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";
import { canManageMerchantMenus } from "@/lib/merchant/merchant-role-capabilities";
import { listMenusForMerchantHomeSummary } from "@/lib/menus/list-menus-for-merchant";
import { getMerchantTodayKstMetrics } from "@/lib/orders/merchant-analytics";
import { getMerchantHomeOpsCounts } from "@/lib/orders/merchant-home-ops";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ tenant: string }> };

/** 점주 홈 — ops·오늘 매출·메뉴 요약 (클라이언트 캐시용) */
export async function GET(_request: Request, { params }: RouteParams) {
  const { tenant } = await params;
  const auth = await requireMerchantLiveJsonAccess(tenant);
  if (auth instanceof NextResponse) return auth;

  const canManageMenus = canManageMerchantMenus(auth.role);

  const [opsCounts, todayMetrics, menus] = await Promise.all([
    getMerchantHomeOpsCounts(auth.slug),
    getMerchantTodayKstMetrics(auth.slug),
    canManageMenus ? listMenusForMerchantHomeSummary(auth.slug) : Promise.resolve({ ok: false as const, message: "" }),
  ]);

  return NextResponse.json(
    {
      ok: true,
      canManageMenus,
      ops: opsCounts,
      metrics: todayMetrics,
      menuItems: menus.ok ? menus.items : [],
    },
    MERCHANT_LIVE_JSON_HEADERS,
  );
}
