import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { MerchantSalesMetricsStrip } from "@/components/merchant-sales-metrics-strip";
import type { MerchantTodayKstMetrics } from "@/lib/orders/merchant-analytics";

type Props = {
  tenant: string;
  metrics: Extract<MerchantTodayKstMetrics, { ok: true }>;
};

export function MerchantHomeSalesCard({ tenant, metrics }: Props) {
  const t = encodeURIComponent(tenant);

  const avgOrderValue =
    metrics.completedCount > 0
      ? Math.round(metrics.totalSales / metrics.completedCount)
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
    <section aria-label="이번 영업일 매출">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          이번 영업일
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <div className="rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-base font-black">
            ₩
          </span>
          <div>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">매출 현황</p>
            <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              마감 기준 · 결제 기준
            </p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                결제 매출
              </p>
              <p className="text-4xl font-black tabular-nums leading-none text-zinc-900 dark:text-zinc-50">
                {metrics.totalSales > 0
                  ? metrics.totalSales.toLocaleString("ko-KR")
                  : "0"}
                <span className="ml-1 text-xl font-bold text-zinc-500 dark:text-zinc-400">원</span>
              </p>
            </div>

            {changePercent !== null ? (
              <div className="flex flex-col items-center gap-0.5">
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">전 영업일 대비</p>
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
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">전 영업일 대비</p>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                  데이터 없음
                </span>
              </div>
            ) : null}
          </div>

          <div className="my-3 border-t border-zinc-100 dark:border-zinc-800" />

          <MerchantSalesMetricsStrip
            variant="home"
            items={[
              {
                key: "payments",
                label: "결제 수",
                value: (
                  <>
                    {metrics.completedCount}
                    <span className="text-xs font-semibold text-zinc-400">건</span>
                  </>
                ),
                valueClassName: "text-emerald-600 dark:text-emerald-400",
              },
              {
                key: "avg",
                label: "객단가",
                value:
                  avgOrderValue > 0 ? (
                    <span className="text-sm font-bold">
                      {avgOrderValue.toLocaleString("ko-KR")}
                      <span className="text-[10px] font-semibold text-zinc-400">원</span>
                    </span>
                  ) : (
                    "—"
                  ),
              },
              {
                key: "orders",
                label: "접수",
                value: (
                  <>
                    {metrics.orderCount}
                    <span className="text-xs font-semibold text-zinc-400">건</span>
                  </>
                ),
              },
              {
                key: "cancel",
                label: "취소율",
                value: (
                  <>
                    {cancelRate}
                    <span className="text-xs font-semibold text-zinc-400">%</span>
                  </>
                ),
                valueClassName:
                  cancelRate > 0 ? "text-red-600 dark:text-red-400" : undefined,
              },
            ]}
          />

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
