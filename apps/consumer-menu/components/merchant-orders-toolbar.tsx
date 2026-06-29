"use client";

import { OrderStatusRefresh } from "@/components/order-status-refresh";
import { chayaAppShellBleedClass } from "@/lib/responsive/chaya-app-shell";

export type MerchantOrdersSummary = {
  pending: number;
  cooking: number;
  ready: number;
  todayPaid: number;
  delayedCount: number;
};

type Props = {
  summary: MerchantOrdersSummary;
};

type ChipProps = {
  label: string;
  colorClass: string;
  dotClass: string;
  pulse?: boolean;
};

function SummaryChip({ label, colorClass, dotClass, pulse }: ChipProps) {
  return (
    <span
      className={[
        "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
        colorClass,
        pulse ? "animate-pulse" : "",
      ].join(" ")}
    >
      <span className={`h-[5px] w-[5px] rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

export function MerchantOrdersToolbar({ summary }: Props) {
  const total = summary.pending + summary.cooking + summary.ready;

  return (
    <div
      className={`${chayaAppShellBleedClass} border-b border-zinc-100 bg-white/95 py-2 dark:border-zinc-800 dark:bg-zinc-950/95`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* 요약 칩 스크롤 */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* 실시간 뱃지 */}
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-emerald-500" />
            실시간
          </span>

          {total > 0 ? (
            <span className="h-3.5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />
          ) : null}

          {summary.delayedCount > 0 ? (
            <SummaryChip
              label={`지연 ${summary.delayedCount}건`}
              colorClass="bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
              dotClass="bg-red-500"
              pulse
            />
          ) : null}
          {summary.pending > 0 ? (
            <SummaryChip
              label={`신규 ${summary.pending}건`}
              colorClass="bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
              dotClass="bg-red-500"
            />
          ) : null}
          {summary.cooking > 0 ? (
            <SummaryChip
              label={`조리중 ${summary.cooking}건`}
              colorClass="bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
              dotClass="bg-orange-500"
            />
          ) : null}
          {summary.ready > 0 ? (
            <SummaryChip
              label={`서빙완료 ${summary.ready}건`}
              colorClass="bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400"
              dotClass="bg-sky-500"
            />
          ) : null}
          {summary.todayPaid > 0 ? (
            <SummaryChip
              label={`결제 ${summary.todayPaid}건`}
              colorClass="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
              dotClass="bg-emerald-500"
            />
          ) : null}
          {total === 0 && summary.delayedCount === 0 ? (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">대기 중인 주문 없음</span>
          ) : null}
        </div>

        {/* 새로고침 */}
        <OrderStatusRefresh compact autoRefresh={false} />
      </div>
    </div>
  );
}
