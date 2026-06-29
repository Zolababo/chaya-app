import { NextResponse } from "next/server";

import { runMerchantPendingReAlertPushCron } from "@/lib/notifications/merchant-pending-push-cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Vercel Cron — 미처리(pending) 주문이 있는 매장에 Web Push 재알림.
 * 앱이 백그라운드일 때 주방 알림음 대신 시스템 알림·진동으로 알립니다.
 */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runMerchantPendingReAlertPushCron();

  return NextResponse.json(
    { ok: true, ...result, ts: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
