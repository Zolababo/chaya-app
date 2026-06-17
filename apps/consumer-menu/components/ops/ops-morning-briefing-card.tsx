import { OpsCard, OpsInsightBanner } from "@/components/ops/ops-ui";
import { buildMorningBriefingText } from "@/lib/platform/build-morning-briefing";
import type { PlatformDashboardSnapshot } from "@/lib/platform/platform-analytics";

type Props = {
  snapshot: Extract<PlatformDashboardSnapshot, { ok: true }>;
};

/** 아침 브리핑 푸시 연동 전 — 대시보드 미리보기 */
export function OpsMorningBriefingCard({ snapshot }: Props) {
  const text = buildMorningBriefingText(snapshot);

  return (
    <OpsCard title="🌅 아침 브리핑 미리보기" subtitle="푸시·이메일 발송 연동 전 · 오늘 기준 자동 생성">
      <pre className="overflow-x-auto rounded-lg border border-ops-border bg-ops-surface-2 p-3.5 text-xs leading-relaxed font-medium whitespace-pre-wrap text-ops-muted">
        {text}
      </pre>
      <OpsInsightBanner tone="indigo">
        💡 자동 발송(cron·Resend)은 다음 단계 — 지금은 운영자가 내용 확인용
      </OpsInsightBanner>
    </OpsCard>
  );
}
