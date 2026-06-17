import Link from "next/link";

import type { PlatformMenuTrendRow } from "@/lib/platform/platform-menu-trends";

const RANK_CLS = [
  "bg-[rgba(245,158,11,0.2)] text-[#F59E0B]",
  "bg-slate-400/10 text-slate-400",
  "bg-[rgba(180,120,80,0.1)] text-[#B47850]",
  "bg-ops-surface-3 text-[#4A5568]",
  "bg-ops-surface-3 text-[#4A5568]",
];

type Props = {
  rows: PlatformMenuTrendRow[];
  days: number;
};

export function OpsMenuTrendList({ rows, days }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-ops-muted">최근 {days}일 판매 데이터가 없습니다.</p>;
  }

  return (
    <ul>
      {rows.map((row, i) => (
        <li key={row.name} className="flex items-center gap-3 border-t border-ops-border py-3 first:border-t-0">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black ${RANK_CLS[i] ?? RANK_CLS[4]}`}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-ops-text">{row.name}</p>
            <p className="text-[11px] font-medium text-[#4A5568]">{row.storeCount}개 매장 판매</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[13px] font-extrabold text-ops-text tabular-nums">{row.qty.toLocaleString("ko-KR")}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
