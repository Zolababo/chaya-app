import Link from "next/link";
import type { ReactNode } from "react";

import { opsKpiGridClass } from "@/lib/responsive/chaya-ops-shell";

/** 목업 공통 — 섹션 레이블 (가로선) */
export function OpsSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5 px-0.5">
      <span className="text-[11px] font-bold tracking-wider text-ops-muted uppercase">{children}</span>
      <span className="h-px flex-1 bg-ops-border-2" aria-hidden />
    </div>
  );
}

/** 목업 `.card` */
export function OpsCard({
  title,
  subtitle,
  children,
  className = "",
  headerExtra,
  id,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-xl border border-ops-border bg-ops-surface p-5 ${className}`}
    >
      {(title || headerExtra) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-sm font-extrabold text-ops-text">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-xs font-medium text-[#4A5568]">{subtitle}</p> : null}
          </div>
          {headerExtra}
        </div>
      )}
      {children}
    </section>
  );
}

export function OpsBadge({
  children,
  tone = "indigo",
}: {
  children: ReactNode;
  tone?: "green" | "red" | "orange" | "blue" | "indigo" | "purple";
}) {
  const cls: Record<string, string> = {
    green: "bg-[rgba(34,211,160,0.12)] text-[#22D3A0]",
    red: "bg-[rgba(240,82,82,0.12)] text-[#F05252]",
    orange: "bg-[rgba(247,152,58,0.12)] text-[#F7983A]",
    blue: "bg-[rgba(56,189,248,0.12)] text-[#38BDF8]",
    indigo: "bg-[rgba(91,107,248,0.18)] text-[#5B6BF8]",
    purple: "bg-violet-500/15 text-violet-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cls[tone]}`}
    >
      {children}
    </span>
  );
}

/** 목업 `.kpi-card` — 상단 컬러 악센트 */
export function OpsKpiCard({
  label,
  value,
  change,
  changeTone = "up",
  sub,
  accent = "indigo",
}: {
  label: string;
  value: string;
  change?: string;
  changeTone?: "up" | "down" | "warn";
  sub?: string;
  accent?: "indigo" | "green" | "orange" | "red";
}) {
  const topBar: Record<string, string> = {
    indigo: "before:bg-[#5B6BF8]",
    green: "before:bg-[#22D3A0]",
    orange: "before:bg-[#F7983A]",
    red: "before:bg-[#F05252]",
  };
  const changeCls: Record<string, string> = {
    up: "text-[#22D3A0]",
    down: "text-[#F05252]",
    warn: "text-[#F7983A]",
  };
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-ops-border bg-ops-surface p-[18px_20px] transition hover:border-ops-border-2 before:absolute before:top-0 before:right-0 before:left-0 before:h-0.5 ${topBar[accent]}`}
    >
      <p className="mb-2 text-[11px] font-bold tracking-wide text-[#4A5568]">{label}</p>
      <p className="text-[26px] font-black tracking-tight text-ops-text tabular-nums">{value}</p>
      {(change || sub) && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {change ? <p className={`text-xs font-bold ${changeCls[changeTone]}`}>{change}</p> : <span />}
          {sub ? <p className="text-[11px] font-medium text-[#4A5568]">{sub}</p> : null}
        </div>
      )}
    </div>
  );
}

/** 목업 홈 페이지 헤더 */
export function OpsPageHero({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-black text-ops-text">{title}</h2>
        <p className="mt-1 text-xs font-medium text-[#4A5568]">{subtitle}</p>
      </div>
      {badge}
    </div>
  );
}

/** 목업 `.bar-chart-area` */
export function OpsBarChart({
  days,
  insight,
}: {
  days: { label: string; sales: number; isToday?: boolean }[];
  insight?: string;
}) {
  const max = Math.max(...days.map((d) => d.sales), 1);
  const peak = Math.max(...days.map((d) => d.sales));
  return (
    <>
      <div className="mt-4 flex h-[120px] items-end gap-2">
        {days.map((d) => {
          const pct = Math.max(3, Math.round((d.sales / max) * 100));
          const highlight = d.sales === peak && d.sales > 0;
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={[
                  "w-full min-h-[3px] cursor-default rounded-t transition-opacity",
                  highlight
                    ? "bg-[#5B6BF8] shadow-[0_0_12px_rgba(91,107,248,0.5)]"
                    : "bg-[rgba(91,107,248,0.45)]",
                ].join(" ")}
                style={{ height: `${pct}%` }}
                title={`${d.label}: ${d.sales.toLocaleString("ko-KR")}원`}
              />
              <span
                className={[
                  "text-[10px] font-semibold whitespace-nowrap",
                  highlight ? "font-extrabold text-[#5B6BF8]" : "text-[#4A5568]",
                ].join(" ")}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      {insight ? <OpsInsightBanner tone="indigo">{insight}</OpsInsightBanner> : null}
    </>
  );
}

const SYSTEM_ROWS = [
  { icon: "⚡", name: "API 서버", meta: "응답 정상", status: "정상", tone: "ok" as const },
  { icon: "🗄️", name: "Supabase DB", meta: "RLS · service role", status: "정상", tone: "ok" as const },
  { icon: "🌐", name: "Vercel CDN", meta: "전 세계 배포", status: "정상", tone: "ok" as const },
  { icon: "🔔", name: "푸시 알림", meta: "아침 브리핑 (예정)", status: "주의", tone: "warn" as const },
];

/** 목업 시스템 상태 리스트 */
export function OpsSystemStatusList() {
  return (
    <div>
      {SYSTEM_ROWS.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between border-t border-ops-border py-3 first:border-t-0"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            <div>
              <p className="text-[13px] font-bold text-ops-text">{item.name}</p>
              <p className="text-[11px] font-medium text-[#4A5568]">{item.meta}</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${item.tone === "ok" ? "text-[#22D3A0]" : "text-[#F7983A]"}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${item.tone === "ok" ? "animate-pulse bg-[#22D3A0]" : "bg-[#F7983A]"}`}
            />
            {item.status}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 목업 `.briefing-banner` */
export function OpsBriefingBanner({
  dateLabel,
  title,
  stats,
}: {
  dateLabel: string;
  title: string;
  stats: { value: string; label: string; hint?: string }[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4">
      <div
        className="pointer-events-none absolute -top-5 -right-5 h-[100px] w-[100px] rounded-full bg-white/10"
        aria-hidden
      />
      <p className="text-[11px] font-semibold text-white/70">📅 {dateLabel}</p>
      <p className="mt-1.5 text-[15px] font-black text-white">{title}</p>
      <div className="mt-2.5 flex flex-wrap gap-4 sm:gap-6">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xl font-black tabular-nums text-white">{s.value}</p>
            <p className="text-[10px] font-semibold text-white/70">{s.label}</p>
            {s.hint ? <p className="mt-0.5 text-[11px] font-bold text-cyan-200">{s.hint}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 목업 `.health-grid` */
export function OpsHealthGrid({
  cells,
}: {
  cells: {
    icon: string;
    value: string;
    label: string;
    hint?: string;
    hintTone?: "up" | "down" | "warn";
    accent: "green" | "orange" | "blue" | "red";
  }[];
}) {
  const border: Record<string, string> = {
    green: "before:bg-emerald-500",
    orange: "before:bg-amber-500",
    blue: "before:bg-blue-500",
    red: "before:bg-red-500",
  };
  const hintCls: Record<string, string> = {
    up: "text-emerald-400",
    down: "text-red-400",
    warn: "text-amber-400",
  };
  return (
    <div className={opsKpiGridClass}>
      {cells.map((c) => (
        <div
          key={c.label}
          className={`relative overflow-hidden rounded-[10px] border border-ops-border bg-ops-surface p-3.5 before:absolute before:top-0 before:left-0 before:h-full before:w-[3px] before:rounded-l ${border[c.accent]}`}
        >
          <p className="mb-1.5 text-lg" aria-hidden>
            {c.icon}
          </p>
          <p className="text-[22px] font-black tabular-nums text-ops-text leading-none">{c.value}</p>
          <p className="mt-1 text-[11px] font-semibold text-ops-muted">{c.label}</p>
          {c.hint ? (
            <p className={`mt-1 text-[10px] font-bold ${hintCls[c.hintTone ?? "up"]}`}>{c.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** 목업 `.rank-item` */
export function OpsRankList({
  rows,
}: {
  rows: {
    slug: string;
    name: string;
    meta: string;
    sales: string;
    rank: number;
  }[];
}) {
  const rankCls = (n: number) => {
    if (n === 1) return "bg-amber-500/20 text-amber-400";
    if (n === 2) return "bg-slate-400/15 text-slate-400";
    if (n === 3) return "bg-orange-800/20 text-orange-400";
    return "bg-slate-700 text-ops-muted";
  };

  return (
    <ul>
      {rows.map((r) => (
        <li key={r.slug} className="border-t border-ops-border first:border-t-0">
          <Link
            href={`/ops/stores/${encodeURIComponent(r.slug)}`}
            className="flex items-center gap-3 py-2.5 transition hover:opacity-90"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-xs font-black ${rankCls(r.rank)}`}
            >
              {r.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ops-text">{r.name}</p>
              <p className="truncate text-[11px] font-medium text-ops-muted">{r.meta}</p>
            </div>
            <p className="shrink-0 text-sm font-extrabold tabular-nums text-ops-text">{r.sales}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OpsInsightBanner({
  children,
  tone = "indigo",
}: {
  children: ReactNode;
  tone?: "indigo" | "green" | "red";
}) {
  const cls = {
    indigo: "border-indigo-500 bg-indigo-500/10 text-indigo-300",
    green: "border-emerald-500 bg-emerald-500/10 text-emerald-300",
    red: "border-red-500 bg-red-500/10 text-red-300",
  };
  return (
    <p className={`mt-2.5 rounded-lg border-l-[3px] px-2.5 py-2 text-[11px] font-bold ${cls[tone]}`}>
      {children}
    </p>
  );
}

export function healthScoreTone(score: number): "high" | "mid" | "low" {
  if (score >= 80) return "high";
  if (score >= 40) return "mid";
  return "low";
}

export function healthScoreColor(tone: "high" | "mid" | "low"): string {
  if (tone === "high") return "text-emerald-400";
  if (tone === "mid") return "text-amber-400";
  return "text-red-400";
}

export function healthBarColor(tone: "high" | "mid" | "low"): string {
  if (tone === "high") return "bg-emerald-500";
  if (tone === "mid") return "bg-amber-500";
  return "bg-red-500";
}
