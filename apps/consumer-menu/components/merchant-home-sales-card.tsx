import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import type { MerchantTodayKstMetrics } from "@/lib/orders/merchant-analytics";

type Props = {
  tenant: string;
  metrics: Extract<MerchantTodayKstMetrics, { ok: true }>;
};

export function MerchantHomeSalesCard({ tenant, metrics }: Props) {
  const t = encodeURIComponent(tenant);

  const nonCancelledCount = metrics.orderCount - metrics.cancelledCount;
  const avgOrderValue = nonCancelledCount > 0
    ? Math.round(metrics.totalSales / nonCancelledCount)
    : 0;
  const cancelRate = metrics.orderCount > 0
    ? Math.round((metrics.cancelledCount / metrics.orderCount) * 100)
    : 0;

  let changePercent: number | null = null;
  if (metrics.yesterdaySales !== null && metrics.yesterdaySales > 0) {
    changePercent = Math.round(
      ((metrics.totalSales - metrics.yesterdaySales) / metrics.yesterdaySales) * 100,
    );
  }

  const isUp = changePercent !== null && changePercent > 0;
  const isDown = changePercent !== null && changePercent < 0;

  return (
    <section aria-label="오늘 매출">
      {/* 섹션 레이블 */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          오늘 매출
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <div className="rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
        {/* 카드 헤더 */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-base font-black">
            ₩
          </span>
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">매출 현황</p>
        </div>

        <div className="px-4 pb-4">
          {/* 총 매출 + 어제 대비 % */}
          <div className="flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500">총 매출</p>
              <p className="text-4xl font-black tabular-nums leading-none text-zinc-900 dark:text-zinc-50">
                {metrics.totalSales > 0
                  ? metrics.totalSales.toLocaleString("ko-KR")
                  : "0"}
                <span className="ml-1 text-xl font-bold text-zinc-500 dark:text-zinc-400">원</span>
              </p>
            </div>

            {/* 어제 대비 뱃지 */}
            {changePercent !== null ? (
              <div className="flex flex-col items-center gap-0.5">
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">어제 대비</p>
                <div
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold ${
                    isUp
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : isDown
                        ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : isDown ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                  {changePercent > 0 ? "+" : ""}{changePercent}%
                </div>
              </div>
            ) : metrics.yesterdaySales !== null ? (
              <div className="flex flex-col items-center gap-0.5">
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">어제 대비</p>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                  데이터 없음
                </span>
              </div>
            ) : null}
          </div>

          {/* 구분선 */}
          <div className="my-3 border-t border-zinc-100 dark:border-zinc-800" />

          {/* 3개 지표 — 라벨 상단 고정·값 하단 고정·세로 구분선 */}
          <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800">
            {/* 주문 수 */}
            <div className="flex min-h-[3.5rem] flex-col items-center justify-between px-2 py-0.5 text-center">
              <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">주문 수</p>
              <p className="text-xl font-black tabular-nums leading-none text-zinc-900 dark:text-zinc-50">
                {metrics.orderCount}
                <span className="text-xs font-semibold text-zinc-400">건</span>
              </p>
            </div>

            {/* 객단가 */}
            <div className="flex min-h-[3.5rem] flex-col items-center justify-between px-2 py-0.5 text-center">
              <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">객단가</p>
              <p className="text-sm font-bold tabular-nums leading-none text-zinc-900 dark:text-zinc-50">
                {avgOrderValue > 0
                  ? `${avgOrderValue.toLocaleString("ko-KR")}원`
                  : "—"}
              </p>
            </div>

            {/* 취소율 */}
            <div className="flex min-h-[3.5rem] flex-col items-center justify-between px-2 py-0.5 text-center">
              <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">취소율</p>
              <p
                className={`text-xl font-black tabular-nums leading-none ${
                  cancelRate > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-900 dark:text-zinc-50"
                }`}
              >
                {cancelRate}
                <span className="text-xs font-semibold text-zinc-400">%</span>
              </p>
            </div>
          </div>

          {/* 분석 탭 링크 — 오늘(days=1) 뷰로 바로 이동 */}
          <Link
            href={`/m/${t}/analytics?days=1`}
            className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            분석 탭에서 자세히 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
