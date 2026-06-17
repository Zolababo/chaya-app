import type { PlatformHealthGrade } from "@/lib/platform/platform-health-score";

const GRADE_CLASS: Record<PlatformHealthGrade, string> = {
  A: "bg-emerald-500/15 text-emerald-300",
  B: "bg-sky-500/15 text-sky-300",
  C: "bg-amber-500/15 text-amber-300",
  D: "bg-red-500/15 text-red-300",
};

type Props = {
  score: number;
  grade: PlatformHealthGrade;
  compact?: boolean;
};

export function OpsStoreHealthBadge({ score, grade, compact }: Props) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full font-bold tabular-nums",
        GRADE_CLASS[grade],
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      ].join(" ")}
      title={`건강 점수 ${score}/100`}
    >
      <span>{grade}</span>
      <span className="opacity-80">{score}</span>
    </span>
  );
}

export function OpsHealthBreakdownList({
  items,
}: {
  items: { label: string; points: number; max: number; ok: boolean; detail: string }[];
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-start justify-between gap-2 text-sm">
          <div className="min-w-0">
            <p className={item.ok ? "font-medium text-ops-text" : "text-ops-muted"}>
              {item.ok ? "✓" : "○"} {item.label}
            </p>
            <p className="text-xs text-ops-muted">{item.detail}</p>
          </div>
          <span className="shrink-0 tabular-nums text-xs font-bold text-indigo-400">
            {item.points}/{item.max}
          </span>
        </li>
      ))}
    </ul>
  );
}
