import type { ReactNode } from "react";

import {
  chayaOpsShellClass,
  opsConsoleContentClass,
  opsKpiTileClass,
  opsKpiTileValueClass,
  opsPageHeaderClass,
  opsPageTitleClass,
  opsSectionCardClass,
  opsSectionCardTitleClass,
  opsShellWithCompactNavClass,
} from "@/lib/responsive/chaya-ops-shell";

type Props = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  /** 메인 탭 — 목업처럼 큰 페이지 헤더 생략 */
  bare?: boolean;
};

export function OpsPageHeader({ title, subtitle, actions }: Omit<Props, "children" | "wide" | "bare">) {
  return (
    <header className={opsPageHeaderClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">CHAYA Admin</p>
          <h1 className={opsPageTitleClass}>{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-ops-subtle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function OpsConsoleFrame({ title, subtitle, actions, children, wide, bare }: Props) {
  return (
    <div
      className={[
        chayaOpsShellClass,
        opsShellWithCompactNavClass,
        opsConsoleContentClass,
        "w-full",
        wide ? "" : "",
      ].join(" ")}
    >
      {!bare && title ? (
        <OpsPageHeader title={title} subtitle={subtitle} actions={actions} />
      ) : null}
      {children}
    </div>
  );
}

export function OpsKpiTile({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        opsKpiTileClass,
        highlight
          ? "border-indigo-500/40 bg-indigo-500/10"
          : "border-ops-border bg-ops-surface",
      ].join(" ")}
    >
      <p className="text-[11px] font-semibold text-ops-muted">{label}</p>
      <p className={opsKpiTileValueClass}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] text-ops-muted">{hint}</p> : null}
    </div>
  );
}

/** @deprecated OpsCard 사용 권장 */
export function OpsSectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`${opsSectionCardClass} ${className}`}
    >
      <h2 className={opsSectionCardTitleClass}>{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
