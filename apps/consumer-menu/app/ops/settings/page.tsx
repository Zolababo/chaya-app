import Link from "next/link";

import { OpsConsoleFrame } from "@/components/ops/ops-console-frame";
import { OpsNoticeForm } from "@/components/ops/ops-notice-form";
import { OpsSystemStatusPanel } from "@/components/ops/ops-system-status-panel";
import { OpsBadge, OpsCard, OpsPageHero } from "@/components/ops/ops-ui";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import { opsGrid2ColClass, opsGrid3ColClass } from "@/lib/responsive/chaya-ops-shell";

export const dynamic = "force-dynamic";

const SETTING_LINKS = [
  {
    href: "/ops/merchants",
    icon: "👤",
    bg: "bg-[rgba(91,107,248,0.12)]",
    name: "점주 멤버십",
    desc: "초대 · 승인 · 연결 관리",
  },
  {
    href: "/ops/audit",
    icon: "📋",
    bg: "bg-[rgba(34,211,160,0.12)]",
    name: "감사 로그",
    desc: "전 매장 변경 이력",
  },
  {
    href: "/health",
    icon: "⚡",
    bg: "bg-[rgba(247,152,58,0.12)]",
    name: "헬스체크",
    desc: "/health 엔드포인트",
  },
] as const;

export default async function OpsSettingsPage() {
  await requirePlatformOperator("/ops/settings");

  return (
    <OpsConsoleFrame bare>
      <OpsPageHero
        title="시스템 설정"
        subtitle="CHAYA Admin · 운영 관리"
      />

      <div className={opsGrid2ColClass}>
        <OpsCard title="시스템 상태" subtitle="실시간 서비스 운영 현황">
          <OpsSystemStatusPanel />
        </OpsCard>

        <OpsNoticeForm />
      </div>

      <div className={`mt-3.5 ${opsGrid3ColClass}`}>
        <OpsCard title="관리 메뉴" subtitle="계정 및 권한 설정">
          <ul>
            {SETTING_LINKS.slice(0, 2).map((item) => (
              <li key={item.href} className="border-t border-ops-border first:border-t-0">
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 py-3.5 transition hover:opacity-80"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-[17px] ${item.bg}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-ops-text">{item.name}</p>
                      <p className="text-[11px] font-medium text-[#4A5568]">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-base text-[#4A5568]">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </OpsCard>

        <OpsCard title="데이터 관리" subtitle="익스포트 및 감사">
          <ul>
            <li className="border-t border-ops-border first:border-t-0">
              <Link
                href="/ops/stores/export"
                className="flex items-center justify-between gap-3 py-3.5 transition hover:opacity-90"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[rgba(56,189,248,0.12)] text-[17px]">
                    📤
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ops-text">매장 CSV 내보내기</p>
                    <p className="text-[11px] font-medium text-[#4A5568]">건강점수·매출·온보딩 지표</p>
                  </div>
                </div>
                <span className="text-base text-[#4A5568]">›</span>
              </Link>
            </li>
            <li className="border-t border-ops-border">
              <Link
                href="/ops/audit/export"
                className="flex items-center justify-between gap-3 py-3.5 transition hover:opacity-90"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[rgba(139,92,246,0.12)] text-[17px]">
                    📋
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ops-text">감사 로그 CSV</p>
                    <p className="text-[11px] font-medium text-[#4A5568]">전 매장 변경 이력</p>
                  </div>
                </div>
                <span className="text-base text-[#4A5568]">›</span>
              </Link>
            </li>
            <li className="border-t border-ops-border">
              <Link
                href="/ops/data"
                className="flex items-center justify-between gap-3 py-3.5 transition hover:opacity-90"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[rgba(91,107,248,0.12)] text-[17px]">
                    📊
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ops-text">분석 리포트</p>
                    <p className="text-[11px] font-medium text-[#4A5568]">기간별 매출·메뉴 트렌드</p>
                  </div>
                </div>
                <span className="text-base text-[#4A5568]">›</span>
              </Link>
            </li>
          </ul>
        </OpsCard>

        <OpsCard className="flex flex-col justify-between">
          <div>
            <p className="text-sm font-extrabold text-ops-text">버전 정보</p>
            <p className="mt-0.5 text-xs font-medium text-[#4A5568]">CHAYA Admin · Beta</p>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#4A5568]">환경</span>
                <OpsBadge tone="green">Production</OpsBadge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#4A5568]">스택</span>
                <span className="font-bold font-mono text-ops-muted">Next.js + Supabase</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#4A5568]">배포</span>
                <span className="font-bold font-mono text-ops-muted">Vercel · Edge</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] font-medium text-[#4A5568]">© 2026 CHAYA Platform</p>
        </OpsCard>
      </div>
    </OpsConsoleFrame>
  );
}
