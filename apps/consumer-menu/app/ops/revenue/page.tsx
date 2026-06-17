import { OpsConsoleFrame } from "@/components/ops/ops-console-frame";
import { OpsBadge, OpsCard, OpsInsightBanner, OpsPageHero } from "@/components/ops/ops-ui";
import { listPlatformStores } from "@/lib/platform/list-platform-stores";
import { getPlatformQrTraffic } from "@/lib/platform/platform-qr-traffic";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import { opsGrid2ColClass } from "@/lib/responsive/chaya-ops-shell";

export const dynamic = "force-dynamic";

const PIPELINE = [
  {
    icon: "📊",
    bg: "bg-[rgba(91,107,248,0.12)]",
    name: "메뉴 데이터 판매",
    desc: "식품 제조사 · 식재료 유통사",
    status: "준비 중",
    statusColor: "text-[#F7983A]",
    potential: "잠재 ₩2M/월",
  },
  {
    icon: "🛒",
    bg: "bg-[rgba(34,211,160,0.12)]",
    name: "식재료 공동구매 중개",
    desc: "매장간 공동 발주 연결",
    status: "기회 탐색",
    statusColor: "text-[#F7983A]",
    potential: "잠재 ₩5M/월",
  },
  {
    icon: "📱",
    bg: "bg-[rgba(247,152,58,0.12)]",
    name: "QR 메뉴판 광고",
    desc: "고객 접속 시 컨텍스트 광고",
    status: "트래픽 축적",
    statusColor: "text-[#38BDF8]",
    potential: "월 접속 집계",
  },
  {
    icon: "🏛️",
    bg: "bg-[rgba(139,92,246,0.12)]",
    name: "정부·지자체 납품",
    desc: "소상공인 지원사업 연계",
    status: "검토 중",
    statusColor: "text-[#F7983A]",
    potential: "잠재 ₩10M/건",
  },
] as const;

export default async function OpsRevenuePage() {
  await requirePlatformOperator("/ops/revenue");
  const storesRes = await listPlatformStores();
  const totalStores = storesRes.ok ? storesRes.stores.length : 0;
  const totalMenus = storesRes.ok ? storesRes.stores.reduce((s, x) => s + x.menuCount, 0) : 0;
  const totalTables = storesRes.ok ? storesRes.stores.reduce((s, x) => s + x.activeTableCount, 0) : 0;
  const qrTraffic = await getPlatformQrTraffic(totalTables);

  const heroStats = [
    { val: `${totalStores}개`, label: "등록 매장", chg: "데이터 축적 중" },
    { val: totalMenus.toLocaleString("ko-KR"), label: "누적 메뉴 데이터", chg: "플랫폼 자산" },
    {
      val: qrTraffic.ok ? qrTraffic.monthVisits.toLocaleString("ko-KR") : totalTables.toLocaleString("ko-KR"),
      label: qrTraffic.ok && qrTraffic.hasData ? "월 QR 접속" : "활성 QR·테이블",
      chg:
        qrTraffic.ok && qrTraffic.monthChangePct != null
          ? `전월 대비 ${qrTraffic.monthChangePct >= 0 ? "+" : ""}${qrTraffic.monthChangePct}%`
          : "집계 시작",
    },
    { val: "준비중", label: "파이프라인 잠재 수익", chg: "/월 예상" },
  ];

  return (
    <OpsConsoleFrame bare>
      <OpsPageHero
        title="수익 파이프라인"
        subtitle="실제 수익 발생 전 준비 단계 · 데이터 자산 및 트래픽 축적 중"
      />

      <div className="relative mb-5 overflow-hidden rounded-xl border border-[rgba(34,211,160,0.15)] bg-gradient-to-br from-[#0B2040] to-[#0D2B30] px-7 py-6">
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(34,211,160,0.08)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-around gap-6">
          {heroStats.map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-6">
              <div className="text-center">
                <p className="font-mono text-[30px] font-black tracking-tight text-ops-text">{s.val}</p>
                <p className="mt-1 text-[11px] font-bold text-[#4A5568]">{s.label}</p>
                <p className="mt-0.5 text-xs font-bold text-[#22D3A0]">{s.chg}</p>
              </div>
              {i < arr.length - 1 ? <div className="hidden h-12 w-px bg-ops-border sm:block" /> : null}
            </div>
          ))}
        </div>
      </div>

      <div className={opsGrid2ColClass}>
        <OpsCard title="수익 파이프라인" subtitle="모델별 현재 상태 및 잠재 수익">
          <ul>
            {PIPELINE.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between gap-3 border-t border-ops-border py-3.5 first:border-t-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-lg ${p.bg}`}>
                    {p.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-ops-text">{p.name}</p>
                    <p className="text-[11px] font-medium text-[#4A5568]">{p.desc}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-xs font-bold ${p.statusColor}`}>{p.status}</p>
                  <p className="mt-0.5 text-[11px] text-[#4A5568]">{p.potential}</p>
                </div>
              </li>
            ))}
          </ul>
        </OpsCard>

        <OpsCard title="QR 접속 트래픽" subtitle="손님 QR ?table= 유입 집계">
          {!qrTraffic.ok ? (
            <p className="text-sm text-ops-muted">{qrTraffic.message}</p>
          ) : (
            <>
              <p className="font-mono text-[38px] font-black tracking-tight text-ops-text">
                {qrTraffic.monthVisits.toLocaleString("ko-KR")}
              </p>
              <p className="text-sm font-bold text-[#4A5568]">회/월 · 활성 테이블 {qrTraffic.activeTables}개</p>
              {qrTraffic.monthChangePct != null ? (
                <span className="mt-2 inline-block">
                  <OpsBadge tone="green">
                    전월 대비 {qrTraffic.monthChangePct >= 0 ? "+" : ""}
                    {qrTraffic.monthChangePct}%
                  </OpsBadge>
                </span>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-ops-border bg-ops-surface-2 px-3.5 py-3.5 text-center">
                  <p className="font-mono text-xl font-extrabold text-ops-text">
                    {qrTraffic.todayVisits.toLocaleString("ko-KR")}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[#4A5568]">오늘 접속</p>
                </div>
                <div className="rounded-lg border border-ops-border bg-ops-surface-2 px-3.5 py-3.5 text-center">
                  <p className="font-mono text-xl font-extrabold text-ops-text">
                    {qrTraffic.activeTables > 0 && qrTraffic.monthVisits > 0
                      ? Math.round(qrTraffic.monthVisits / qrTraffic.activeTables)
                      : "—"}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[#4A5568]">테이블당 월평균</p>
                </div>
              </div>
              {!qrTraffic.hasData ? (
                <OpsInsightBanner tone="indigo">
                  💡 Supabase 마이그레이션 `20260601130000_tenant_qr_visits` 적용 후 QR 스캔부터 집계됩니다.
                </OpsInsightBanner>
              ) : null}
            </>
          )}
        </OpsCard>
      </div>

      <OpsCard className="mt-3.5" title="메뉴 데이터 자산 현황" subtitle={`매장 합산 · 총 ${totalMenus.toLocaleString("ko-KR")}건`}>
        {totalMenus === 0 ? (
          <p className="text-sm text-ops-muted">등록된 메뉴가 없습니다.</p>
        ) : (
          <p className="text-sm text-ops-subtle">
            카테고리별 분포·품질 점수는 메뉴 메타데이터가 더 쌓이면 이 카드에 시각화됩니다.
          </p>
        )}
        <OpsInsightBanner tone="indigo">
          💡 메뉴 5,000건+ · 매장 20곳+ 달성 시 데이터 판매 파이프라인 검토 적기
        </OpsInsightBanner>
      </OpsCard>
    </OpsConsoleFrame>
  );
}
