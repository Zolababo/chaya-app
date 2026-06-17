"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { opsCompactHeaderClass } from "@/lib/responsive/chaya-ops-shell";

type Props = {
  alertCount?: number;
};

/** 목업 `.app-header` — 모바일 상단 브랜드 바 */
export function OpsAppHeader({ alertCount = 0 }: Props) {
  const pathname = usePathname() ?? "";
  const alertsHref = pathname.startsWith("/ops/dashboard") ? "#ops-alerts" : "/ops/dashboard#ops-alerts";

  return (
    <header className={`border-b border-ops-border bg-ops-surface px-5 py-2 ${opsCompactHeaderClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#5B6BF8] to-[#8B5CF6] text-base font-black text-white">
            C
          </div>
          <div>
            <p className="text-[17px] font-black text-ops-text">CHAYA Admin</p>
            <p className="text-[10px] font-semibold text-ops-muted">플랫폼 관리자 콘솔</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
            ADMIN
          </span>
          <Link
            href={alertsHref}
            className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-ops-surface-2 text-base"
            aria-label={alertCount > 0 ? `이상 징후 ${alertCount}건` : "알림"}
          >
            🔔
            {alertCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 animate-pulse rounded-full border border-ops-surface bg-red-500" />
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
