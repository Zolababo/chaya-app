import { OpsAnomalyList } from "@/components/ops/ops-anomaly-list";
import { OpsConsoleFrame } from "@/components/ops/ops-console-frame";
import { OpsMorningBriefingCard } from "@/components/ops/ops-morning-briefing-card";
import { OpsOnboardingFunnel } from "@/components/ops/ops-onboarding-funnel";
import {
  OpsBadge,
  OpsBarChart,
  OpsCard,
  OpsKpiCard,
  OpsPageHero,
  OpsRankList,
  OpsSystemStatusList,
} from "@/components/ops/ops-ui";
import { getPlatformDashboardSnapshot } from "@/lib/platform/platform-analytics";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import {
  opsGrid3ColClass,
  opsGridSplit14Class,
  opsKpiGridClass,
} from "@/lib/responsive/chaya-ops-shell";

export const dynamic = "force-dynamic";

function formatWon(n: number): string {
  return `₩${n.toLocaleString("ko-KR")}`;
}

export default async function OpsDashboardPage() {
  await requirePlatformOperator("/ops/dashboard");
  const snapshot = await getPlatformDashboardSnapshot();

  return (
    <OpsConsoleFrame bare>
      {!snapshot.ok ? (
        <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {snapshot.message}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <OpsPageHero
            title="☀️ 오늘 플랫폼 현황"
            subtitle={`${snapshot.dateLabel} · 실시간 업데이트`}
            badge={
              <OpsBadge tone="green">
                <span aria-hidden>● </span>
                시스템 정상
              </OpsBadge>
            }
          />

          <div className={opsKpiGridClass}>
            <OpsKpiCard
              label="💰 오늘 전체 매출"
              value={formatWon(snapshot.totalSalesToday)}
              change="오늘 집계"
              sub={`${snapshot.totalOrdersToday.toLocaleString("ko-KR")}건 주문`}
              accent="indigo"
            />
            <OpsKpiCard
              label="🟢 현재 영업 중"
              value={`${snapshot.health.operatingToday}개`}
              change={`7일 활성 ${snapshot.health.activeStores7d}곳`}
              sub={`전체 ${snapshot.health.totalStores}개 매장`}
              accent="green"
            />
            <OpsKpiCard
              label="📋 월 활성 매장 (30일)"
              value={`${snapshot.health.orderStores30d}개`}
              change={
                snapshot.health.totalStores > 0
                  ? `활성률 ${Math.round((snapshot.health.orderStores30d / snapshot.health.totalStores) * 100)}%`
                  : undefined
              }
              sub={`이번달 신규 +${snapshot.newStoresThisMonth}`}
              accent="orange"
            />
            <OpsKpiCard
              label="⚠️ 이탈 위험 매장"
              value={`${snapshot.health.churnRisk14d}개`}
              change="14일+ 미주문"
              changeTone="warn"
              sub="즉시 대응 필요"
              accent="red"
            />
          </div>

          <div className={opsGridSplit14Class}>
            <OpsCard
              title="일별 매출 추이"
              subtitle="최근 7일 · 전체 매장 합산 (원)"
              headerExtra={
                snapshot.salesTrend7d.length > 1 ? (
                  <OpsBadge tone="indigo">7일 추이</OpsBadge>
                ) : undefined
              }
            >
              <OpsBarChart
                days={snapshot.salesTrend7d}
                insight={
                  snapshot.salesTrend7d.some((d) => d.sales > 0)
                    ? "💡 최근 7일 매출 추이 — 피크일 매장 운영 패턴을 확인하세요"
                    : undefined
                }
              />
            </OpsCard>

            <OpsAnomalyList alerts={snapshot.alerts} />
          </div>

          <OpsMorningBriefingCard snapshot={snapshot} />

          <div className={opsGrid3ColClass}>
            <OpsCard title="오늘 매출 순위" subtitle="영업중인 매장 기준">
              {snapshot.rankings.length === 0 ? (
                <p className="text-sm text-ops-muted">오늘 주문이 있는 매장이 없습니다.</p>
              ) : (
                <OpsRankList
                  rows={snapshot.rankings.map((r, i) => ({
                    slug: r.tenantSlug,
                    name: r.displayName,
                    meta: `${r.todayOrders}건 · 평균 ${r.todayOrders > 0 ? formatWon(Math.round(r.todaySales / r.todayOrders)) : "—"}`,
                    sales: formatWon(r.todaySales),
                    rank: i + 1,
                  }))}
                />
              )}
            </OpsCard>

            <OpsCard title="온보딩 퍼널" subtitle="신규 가입 후 단계별 전환율">
              <OpsOnboardingFunnel funnel={snapshot.funnel} />
            </OpsCard>

            <OpsCard title="시스템 상태" subtitle="실시간 운영 현황">
              <OpsSystemStatusList />
            </OpsCard>
          </div>
        </div>
      )}
    </OpsConsoleFrame>
  );
}
