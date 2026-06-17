"use client";

import Link from "next/link";

import {
  OPS_ANALYTICS_PERIODS,
  type OpsAnalyticsPeriod,
} from "@/lib/platform/ops-analytics-period-shared";

type Props = {
  active: OpsAnalyticsPeriod;
};

/** `/ops/data?period=` 기간 선택 */
export function OpsAnalyticsPeriodPicker({ active }: Props) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-[10px] border border-ops-border bg-ops-surface-2 p-1"
      role="group"
      aria-label="분석 기간"
    >
      {OPS_ANALYTICS_PERIODS.map((p) => {
        const isActive = p.id === active;
        return (
          <Link
            key={p.id}
            href={`/ops/data?period=${p.id}`}
            className={[
              "rounded-[7px] px-3.5 py-1.5 text-xs font-bold transition",
              isActive
                ? "bg-[#5B6BF8] text-white shadow-[0_2px_8px_rgba(91,107,248,0.4)]"
                : "text-[#4A5568] hover:text-ops-muted",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
