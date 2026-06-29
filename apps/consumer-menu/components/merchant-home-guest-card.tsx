"use client";

import type { MerchantTodayGuestSummary } from "@/lib/merchant/merchant-guest-insights";

type Props = {
  summary: Extract<MerchantTodayGuestSummary, { ok: true }>;
};

/** 점주 홈 — 이번 영업일 결제완료 손님 요약 */
export function MerchantHomeGuestCard({ summary }: Props) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-chaya-border/60 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="이번 영업일 손님"
    >
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">이번 영업일 손님</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {summary.rangeLabel} · 결제완료 · 같은 폰·브라우저
        </p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800">
        <div className="px-3 py-3 text-center">
          <p className="text-[10px] font-semibold text-zinc-400">결제완료</p>
          <p className="mt-1 text-xl font-black tabular-nums text-zinc-900 dark:text-zinc-50">
            {summary.todayCompletedVisits}
          </p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-[10px] font-semibold text-zinc-400">첫 방문</p>
          <p className="mt-1 text-xl font-black tabular-nums text-zinc-700 dark:text-zinc-200">
            {summary.todayFirstVisitGuests}
          </p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-[10px] font-semibold text-zinc-400">재방문</p>
          <p className="mt-1 text-xl font-black tabular-nums text-chaya-primary dark:text-orange-400">
            {summary.todayReturningGuests}
          </p>
        </div>
      </div>
    </section>
  );
}
