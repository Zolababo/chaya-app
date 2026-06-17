import { OpsConsoleFrame } from "@/components/ops/ops-console-frame";
import { OpsAnalyticsPeriodPicker } from "@/components/ops/ops-analytics-period-picker";
import { OpsMenuTrendList } from "@/components/ops/ops-menu-trend-list";
import { OpsOnboardingFunnel } from "@/components/ops/ops-onboarding-funnel";
import { OpsRetentionTable } from "@/components/ops/ops-retention-table";
import {
  OpsBarChart,
  OpsCard,
  OpsInsightBanner,
  OpsKpiCard,
  OpsPageHero,
} from "@/components/ops/ops-ui";
import { getPlatformDashboardSnapshot } from "@/lib/platform/platform-analytics";
import { getPlatformMenuTrends } from "@/lib/platform/platform-menu-trends";
import {
  getOpsPeriodWindow,
  getPlatformPeriodAnalytics,
  parseOpsAnalyticsPeriod,
} from "@/lib/platform/ops-analytics-period";
import { getPlatformRetentionCohorts } from "@/lib/platform/platform-retention-cohort";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import {
  opsGrid2ColClass,
  opsGridSplit15Class,
  opsKpiGridClass,
} from "@/lib/responsive/chaya-ops-shell";

export const dynamic = "force-dynamic";

function formatWon(n: number): string {
  return `₩${n.toLocaleString("ko-KR")}`;
}

type Props = {
  searchParams: Promise<{ period?: string }>;
};

export default async function OpsDataPage({ searchParams }: Props) {
  await requirePlatformOperator("/ops/data");
  const { period: periodRaw } = await searchParams;
  const period = parseOpsAnalyticsPeriod(periodRaw);
  const periodWindow = getOpsPeriodWindow(period);

  const [snapshot, periodAnalytics, menuTrends, cohorts] = await Promise.all([
    getPlatformDashboardSnapshot(),
    getPlatformPeriodAnalytics(period),
    getPlatformMenuTrends(periodWindow.menuTrendDays, 5),
    getPlatformRetentionCohorts(),
  ]);

  const cancelRate =
    periodAnalytics.ok && periodAnalytics.totalOrders > 0
      ? Math.round((periodAnalytics.cancelledOrders / periodAnalytics.totalOrders) * 1000) / 10
      : null;

  return (
    <OpsConsoleFrame bare>
      {!snapshot.ok ? (
        <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {snapshot.message}
        </p>
      ) : !periodAnalytics.ok ? (
        <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {periodAnalytics.message}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <OpsPageHero
              title="분석"
              subtitle={`${periodAnalytics.periodLabel} · 플랫폼 전체 데이터`}
            />
            <OpsAnalyticsPeriodPicker active={period} />
          </div>

          <div className={opsKpiGridClass}>
            <OpsKpiCard
              label="플랫폼 매출 합산"
              value={formatWon(periodAnalytics.totalSales)}
              change={periodAnalytics.periodLabel}
              sub={`${periodAnalytics.totalOrders.toLocaleString("ko-KR")}건 주문`}
              accent="indigo"
            />
            <OpsKpiCard
              label="평균 객단가"
              value={
                periodAnalytics.totalOrders > 0
                  ? formatWon(Math.round(periodAnalytics.totalSales / periodAnalytics.totalOrders))
                  : "—"
              }
              change={`영업 ${snapshot.health.operatingToday}곳 (오늘)`}
              accent="green"
            />
            <OpsKpiCard
              label="7일 활성 매장"
              value={`${snapshot.health.activeStores7d}곳`}
              change={`전체 ${snapshot.health.totalStores}곳`}
              accent="orange"
            />
            <OpsKpiCard
              label="기간 취소율"
              value={cancelRate != null ? `${cancelRate}%` : "—"}
              change={
                periodAnalytics.cancelledOrders > 0
                  ? `${periodAnalytics.cancelledOrders}건 취소`
                  : "취소 없음"
              }
              changeTone={cancelRate != null && cancelRate >= 5 ? "warn" : "up"}
              accent="red"
            />
          </div>

          <div className={opsGridSplit15Class}>
            <OpsCard title="매출 추이" subtitle={periodAnalytics.chartSubtitle}>
              <OpsBarChart days={periodAnalytics.salesTrend} />
            </OpsCard>

            <OpsCard
              title="플랫폼 메뉴 트렌드 Top 5"
              subtitle={`전체 매장 판매 합산 · ${periodAnalytics.periodLabel}`}
            >
              {!menuTrends.ok ? (
                <p className="text-sm text-ops-muted">{menuTrends.message}</p>
              ) : (
                <OpsMenuTrendList rows={menuTrends.rows} days={menuTrends.days} />
              )}
            </OpsCard>
          </div>

          <div className={opsGrid2ColClass}>
            <OpsCard title="매장 리텐션 코호트" subtitle="가입월 기준 · 월별 주문 활성 유지율">
              {!cohorts.ok ? (
                <p className="text-sm text-ops-muted">{cohorts.message}</p>
              ) : (
                <>
                  <OpsRetentionTable rows={cohorts.rows} />
                  <OpsInsightBanner tone="green">
                    ✅ 가입 후 N개월째 해당 월에 1건 이상 주문한 매장 비율
                  </OpsInsightBanner>
                </>
              )}
            </OpsCard>

            <OpsCard title="온보딩 퍼널 분석" subtitle="단계별 이탈 구간 파악">
              <OpsOnboardingFunnel funnel={snapshot.funnel} />
            </OpsCard>
          </div>
        </div>
      )}
    </OpsConsoleFrame>
  );
}
