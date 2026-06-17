import Link from "next/link";

import { OpsBadge, OpsCard } from "@/components/ops/ops-ui";
import type { PlatformAlert } from "@/lib/platform/platform-analytics";

const KIND_SUB: Record<PlatformAlert["kind"], string> = {
  cancel_spike: "취소율 이상 · 즉시 확인",
  inactive_store: "14일+ 주문 없음 · 이탈 위험",
  onboarding_gap: "온보딩 공백 · 메뉴 미등록",
  off_hours_orders: "새벽(02~05시) 비정상 주문",
};

type Props = {
  alerts: PlatformAlert[];
};

/** 목업 `.alert-list` */
export function OpsAnomalyList({ alerts }: Props) {
  const urgentCount = alerts.filter((a) => a.severity === "urgent").length;

  if (alerts.length === 0) {
    return (
      <OpsCard title="🚨 즉각 대응 필요" subtitle="오늘 감지된 이상 징후">
        <p className="text-sm font-semibold text-[#22D3A0]">✓ 지금 확인할 긴급 이상 징후가 없습니다.</p>
      </OpsCard>
    );
  }

  return (
    <OpsCard
      id="ops-alerts"
      title="🚨 즉각 대응 필요"
      subtitle="오늘 감지된 이상 징후"
      headerExtra={urgentCount > 0 ? <OpsBadge tone="red">{urgentCount}건</OpsBadge> : undefined}
    >
      <ul>
        {alerts.map((a) => (
          <li key={`${a.kind}-${a.tenantSlug}-${a.message}`}>
            <Link
              href={`/ops/stores/${encodeURIComponent(a.tenantSlug)}`}
              className="group flex items-start gap-3 border-t border-ops-border py-3 transition first:border-t-0 hover:-mx-5 hover:rounded-lg hover:bg-ops-surface-2 hover:px-5"
            >
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  a.severity === "urgent"
                    ? "animate-pulse bg-[#F05252]"
                    : a.kind === "off_hours_orders"
                      ? "bg-[#38BDF8]"
                      : "bg-[#F7983A]"
                }`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ops-text">{a.message}</p>
                <p className="mt-0.5 text-[11px] font-medium text-[#4A5568]">{KIND_SUB[a.kind]}</p>
              </div>
              <span className="shrink-0 text-[11px] font-medium text-[#4A5568]">
                {a.severity === "urgent" ? "방금" : "주의"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </OpsCard>
  );
}
