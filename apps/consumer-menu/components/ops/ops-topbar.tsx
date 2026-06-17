"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { OpsTopbarSearch } from "@/components/ops/ops-topbar-search";
import { getOpsPageMeta } from "@/lib/platform/ops-page-meta";
import { opsDesktopTopbarClass } from "@/lib/responsive/chaya-ops-shell";

type Props = {
  alertCount?: number;
};

/** PC 백오피스 — 목업 `.topbar` (lg+) */
export function OpsTopbar({ alertCount = 0 }: Props) {
  const pathname = usePathname() ?? "";
  const meta = getOpsPageMeta(pathname);
  const alertsHref = pathname.startsWith("/ops/dashboard") ? "#ops-alerts" : "/ops/dashboard#ops-alerts";

  return (
    <header
      className={`h-14 shrink-0 items-center justify-between border-b border-ops-border bg-ops-surface px-7 ${opsDesktopTopbarClass}`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <h1 className="truncate text-base font-extrabold text-ops-text">{meta.title}</h1>
        <p className="truncate text-xs font-medium text-ops-muted">{meta.breadcrumb}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <OpsTopbarSearch />
        <Link
          href={alertsHref}
          className="relative flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-ops-border bg-ops-surface-2 text-[15px] transition hover:border-ops-border-2 hover:bg-ops-surface-3"
          aria-label={alertCount > 0 ? `이상 징후 ${alertCount}건` : "알림"}
        >
          🔔
          {alertCount > 0 ? (
            <span className="absolute top-1 right-1 h-1.5 w-1.5 animate-pulse rounded-full border border-ops-surface bg-red-500" />
          ) : null}
        </Link>
        <Link
          href="/ops/data"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-ops-border bg-ops-surface-2 text-[15px] transition hover:border-ops-border-2 hover:bg-ops-surface-3"
          aria-label="분석 내보내기"
          title="분석"
        >
          📤
        </Link>
      </div>
    </header>
  );
}
