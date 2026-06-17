import { retentionCellClass, type RetentionCohortRow } from "@/lib/platform/platform-retention-cohort";

const CELL_CLS = {
  high: "bg-[rgba(34,211,160,0.2)] text-[#22D3A0]",
  mid: "bg-[rgba(247,152,58,0.2)] text-[#F7983A]",
  low: "bg-[rgba(240,82,82,0.15)] text-[#F05252]",
};

type Props = {
  rows: RetentionCohortRow[];
};

export function OpsRetentionTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-ops-muted">가입월 데이터가 있는 매장이 없습니다.</p>;
  }

  return (
    <table className="mt-3 w-full border-collapse">
      <thead>
        <tr className="border-b border-ops-border text-[10px] font-bold tracking-wide text-[#4A5568] uppercase">
          <th className="py-1.5 text-left">가입월</th>
          <th className="px-3 py-1.5 text-center">1개월</th>
          <th className="px-3 py-1.5 text-center">2개월</th>
          <th className="px-3 py-1.5 text-center">3개월</th>
          <th className="px-3 py-1.5 text-center">4개월</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.cohortMonth} className="border-b border-ops-border last:border-b-0">
            <td className="py-2 text-xs font-bold text-ops-muted">
              {row.cohortMonth}
              <span className="ml-1 font-medium text-[#4A5568]">({row.size})</span>
            </td>
            {row.months.map((pct, i) => (
              <td key={i} className="px-3 py-2 text-center">
                {pct == null ? (
                  <span className="text-xs text-[#4A5568]">—</span>
                ) : (
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-extrabold ${CELL_CLS[retentionCellClass(pct)]}`}
                  >
                    {pct}%
                  </span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
