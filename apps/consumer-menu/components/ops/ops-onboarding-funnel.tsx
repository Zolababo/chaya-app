import type { OnboardingFunnelSnapshot } from "@/lib/platform/platform-onboarding-funnel";

const STAGE_COLORS = ["#4F46E5", "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"];

type Props = {
  funnel: OnboardingFunnelSnapshot;
};

/** 목업 `.funnel-wrap` */
export function OpsOnboardingFunnel({ funnel }: Props) {
  const maxCount = Math.max(...funnel.stages.map((s) => s.count), 1);
  const firstCount = funnel.stages[0]?.count ?? 0;

  let insight: string | null = null;
  const qr = funnel.stages.find((s) => s.id === "qr_issued");
  const firstOrder = funnel.stages.find((s) => s.id === "first_order");
  if (qr && firstOrder && qr.count > 0 && firstOrder.conversionFromPrev != null && firstOrder.conversionFromPrev < 90) {
    insight = `💡 QR 발급 후 첫 주문 전환율 ${firstOrder.conversionFromPrev}% — 점주 QR 사용 가이드 강화 필요`;
  }

  return (
    <div className="space-y-1.5">
      <p className="mb-2 text-xs text-ops-muted">
        가입 → 활성 전환{" "}
        <strong className="text-indigo-400">{funnel.overallConversion}%</strong>
      </p>
      {funnel.stages.map((stage, i) => {
        const pct = firstCount > 0 ? Math.round((stage.count / firstCount) * 100) : 0;
        const barPct = Math.round((stage.count / maxCount) * 100);
        const color = STAGE_COLORS[i] ?? STAGE_COLORS[0];
        return (
          <div key={stage.id} className="flex items-center gap-2.5">
            <span className="w-20 shrink-0 text-right text-[11px] font-semibold text-ops-muted">
              {stage.label}
            </span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-ops-surface-3">
              <div
                className="flex h-full items-center rounded-md px-2.5 text-[11px] font-bold text-white transition-all"
                style={{ width: `${Math.max(barPct, stage.count > 0 ? 12 : 0)}%`, background: color }}
              >
                {firstCount > 0 ? `${pct}%` : ""}
              </div>
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-extrabold tabular-nums text-ops-text">
              {stage.count}
            </span>
          </div>
        );
      })}
      {insight ? (
        <p className="mt-2.5 rounded-lg border-l-[3px] border-red-500 bg-red-500/10 px-2.5 py-2 text-[11px] font-bold text-red-300">
          {insight}
        </p>
      ) : null}
    </div>
  );
}
