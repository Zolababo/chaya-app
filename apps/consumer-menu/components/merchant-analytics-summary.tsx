import { MerchantSalesMetricsStrip } from "@/components/merchant-sales-metrics-strip";

type Props = {
  days: number;
  orderCount: number;
  totalSales: number;
  completedCount: number;
  cancelledCount: number;
  /** 전 기간 매출 합계 (비교용) */
  prevTotalSales: number;
  /** 전 기간 주문 수 (비교용) */
  prevOrderCount: number;
  fromDate?: string | null;
  toDate?: string | null;
};

function fmtWon(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

function diffBadge(current: number, prev: number) {
  if (prev <= 0) return null;
  const pct = Math.round(((current - prev) / prev) * 100);
  if (pct === 0) return { label: "변동 없음", cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400", arrow: "" };
  if (pct > 0) return { label: `▲ 전 기간 대비 +${pct}%`, cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400", arrow: "up" };
  return { label: `▼ 전 기간 대비 ${pct}%`, cls: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400", arrow: "down" };
}

function orderDiff(current: number, prev: number): string | null {
  if (prev <= 0) return null;
  const diff = current - prev;
  if (diff === 0) return null;
  return diff > 0 ? `▲ ${diff}건` : `▼ ${Math.abs(diff)}건`;
}

export function MerchantAnalyticsSummary({
  days,
  orderCount,
  totalSales,
  completedCount,
  cancelledCount,
  prevTotalSales,
  prevOrderCount,
  fromDate,
  toDate,
}: Props) {
  const periodLabel =
    fromDate && toDate
      ? `${fromDate.slice(5)} ~ ${toDate.slice(5)} (영업일)`
      : days === 1
        ? "이번 영업일"
        : `최근 ${days}영업일`;

  const avgOrderValue =
    completedCount > 0 ? Math.round(totalSales / completedCount) : 0;

  const cancelRate =
    orderCount > 0
      ? ((cancelledCount / orderCount) * 100).toFixed(1)
      : "0.0";

  const badge = diffBadge(totalSales, prevTotalSales);
  const odiff = orderDiff(orderCount, prevOrderCount);

  return (
    <section
      className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900"
      aria-label="기간 요약"
    >
      <div className="px-4 pt-4 pb-3">
        <p className="mb-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
          {periodLabel} · 결제 매출
        </p>
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[30px] font-black leading-none tabular-nums text-zinc-900 dark:text-zinc-50">
              {totalSales.toLocaleString("ko-KR")}
            </span>
            <span className="text-[15px] font-bold text-zinc-500">원</span>
          </div>
          {badge ? (
            <span
              className={[
                "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold",
                badge.cls,
              ].join(" ")}
            >
              {badge.label}
            </span>
          ) : null}
        </div>
      </div>

      <MerchantSalesMetricsStrip
        variant="analytics"
        items={[
          {
            key: "payments",
            label: "결제 수",
            value: `${completedCount.toLocaleString("ko-KR")}건`,
            valueClassName: "text-emerald-600 dark:text-emerald-400",
          },
          {
            key: "avg",
            label: "객단가",
            value: fmtWon(avgOrderValue),
            valueClassName: "text-emerald-600 dark:text-emerald-400",
          },
          {
            key: "orders",
            label: "접수",
            value: `${orderCount.toLocaleString("ko-KR")}건`,
            valueClassName: "text-blue-600 dark:text-blue-400",
            sub: odiff ? (
              <p
                className={[
                  "text-[10px] font-semibold",
                  odiff.startsWith("▲")
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400",
                ].join(" ")}
              >
                {odiff}
              </p>
            ) : undefined,
          },
          {
            key: "cancel",
            label: "취소율",
            value: `${cancelRate}%`,
            valueClassName: "text-red-600 dark:text-red-400",
            sub:
              cancelledCount > 0 ? (
                <p className="text-[10px] font-semibold text-red-400 dark:text-red-500">
                  {cancelledCount}건 취소
                </p>
              ) : undefined,
          },
        ]}
      />
    </section>
  );
}
