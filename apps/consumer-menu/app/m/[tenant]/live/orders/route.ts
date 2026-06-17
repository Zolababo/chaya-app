import { NextResponse } from "next/server";

import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";
import {
  resolveMerchantOrdersTab,
  tabToListQuery,
} from "@/lib/merchant/merchant-orders-tab";
import { listOrdersForMerchant } from "@/lib/orders/list-orders-for-merchant";
import { getMerchantHomeOpsCounts } from "@/lib/orders/merchant-home-ops";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ tenant: string }> };

/** 점주 주문 큐 — 탭별 목록 + ops 칩 (클라이언트 캐시용) */
export async function GET(request: Request, { params }: RouteParams) {
  const { tenant } = await params;
  const auth = await requireMerchantLiveJsonAccess(tenant);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const tabParam = url.searchParams.get("tab") ?? undefined;
  const statusParam = url.searchParams.get("status") ?? undefined;
  const bucketParam = url.searchParams.get("bucket") ?? undefined;
  const todayParam = url.searchParams.get("today") ?? undefined;

  const opsCounts = await getMerchantHomeOpsCounts(auth.slug);
  const pendingCount = opsCounts.ok ? opsCounts.pending : null;
  const activeTab = resolveMerchantOrdersTab(
    tabParam,
    { status: statusParam, bucket: bucketParam, today: todayParam },
    pendingCount,
  );

  const listResult = await listOrdersForMerchant(auth.slug, tabToListQuery(activeTab));

  if (!opsCounts.ok) {
    return NextResponse.json({ ok: false, message: opsCounts.message }, MERCHANT_LIVE_JSON_HEADERS);
  }
  if (!listResult.ok) {
    return NextResponse.json({ ok: false, message: listResult.message }, MERCHANT_LIVE_JSON_HEADERS);
  }

  return NextResponse.json(
    {
      ok: true,
      tab: activeTab,
      rows: listResult.rows,
      ops: {
        pending: opsCounts.pending,
        cooking: opsCounts.cooking,
        ready: opsCounts.ready,
        todayPaid: opsCounts.todayPaid,
        todayCancelled: opsCounts.todayCancelled,
        delayedCount: opsCounts.delayedCount,
        delayedOrderIds: opsCounts.delayedOrders.map((o) => o.id),
      },
    },
    MERCHANT_LIVE_JSON_HEADERS,
  );
}
