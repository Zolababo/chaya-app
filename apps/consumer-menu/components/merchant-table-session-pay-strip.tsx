"use client";

import { completeTableSessionFromForm } from "@/app/m/[tenant]/orders/actions";
import { MerchantOrderActionSubmit } from "@/components/merchant-order-action-submit";
import type { MerchantOpenTableSessionSummary } from "@/lib/merchant/merchant-live-types";
import type { MerchantOrdersTab } from "@/lib/merchant/merchant-orders-tab";

type Props = {
  tenant: string;
  sessions: MerchantOpenTableSessionSummary[];
  ordersTab: MerchantOrdersTab;
  canMutateOrders: boolean;
};

/** 미결제 테이블 세션 — 세션 내 주문이 모두 서빙완료일 때만 표시. */
export function MerchantTableSessionPayStrip({
  tenant,
  sessions,
  ordersTab,
  canMutateOrders,
}: Props) {
  if (!canMutateOrders || sessions.length === 0) return null;

  return (
    <div className="mb-3 space-y-2" aria-label="테이블 결제">
      {sessions.map((session) => (
        <form
          key={session.sessionId}
          action={completeTableSessionFromForm}
          className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30"
        >
          <input type="hidden" name="tenant_slug" value={tenant} />
          <input type="hidden" name="table_no" value={session.tableNo} />
          <input type="hidden" name="orders_tab" value={ordersTab} />
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                테이블 결제
              </p>
              <p className="mt-0.5 text-sm text-emerald-900 dark:text-emerald-100">
                <span className="text-lg font-black tabular-nums">{session.tableNo}</span>
                <span className="ml-1 font-semibold">번</span>
                <span className="mx-1.5 text-emerald-600 dark:text-emerald-400">·</span>
                <span className="font-medium">주문 {session.orderCount}건</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
              <div className="text-left sm:text-right">
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  합계
                </p>
                <p className="whitespace-nowrap text-lg font-black tabular-nums text-emerald-950 dark:text-emerald-50">
                  {session.totalAmount.toLocaleString("ko-KR")}
                  <span className="ml-0.5 text-xs font-semibold">원</span>
                </p>
              </div>
              <MerchantOrderActionSubmit
                label="결제"
                pendingLabel="결제 중…"
                className="min-w-[4.5rem] shrink-0 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:hover:bg-emerald-400"
              />
            </div>
          </div>
        </form>
      ))}
    </div>
  );
}
