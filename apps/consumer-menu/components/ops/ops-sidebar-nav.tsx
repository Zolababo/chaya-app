"use client";

import {
  BarChart3,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { OPS_MAIN_NAV, OPS_SECONDARY_NAV } from "@/lib/platform/ops-nav-items";
import { opsNavMatch, type OpsNavTab } from "@/lib/platform/ops-nav-paths";
import { opsDesktopSidebarClass } from "@/lib/responsive/chaya-ops-shell";

const TAB_ICONS: Record<OpsNavTab, ReactNode> = {
  dashboard: <LayoutDashboard className="h-4 w-4" strokeWidth={2.25} />,
  stores: <Building2 className="h-4 w-4" strokeWidth={2.25} />,
  data: <BarChart3 className="h-4 w-4" strokeWidth={2.25} />,
  revenue: <Wallet className="h-4 w-4" strokeWidth={2.25} />,
  settings: <Settings className="h-4 w-4" strokeWidth={2.25} />,
};

function NavSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 px-2.5 pt-2.5 pb-1.5 text-[10px] font-bold tracking-[0.1em] text-[#4A5568] uppercase">
      {children}
    </p>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={[
        "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition",
        active
          ? "bg-[rgba(91,107,248,0.18)] text-[#5B6BF8]"
          : "text-ops-muted hover:bg-ops-surface-3 hover:text-ops-text",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {active ? (
        <span
          className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-sm bg-[#5B6BF8]"
          aria-hidden
        />
      ) : null}
      {icon ? <span className="w-5 shrink-0 text-center opacity-90">{icon}</span> : null}
      <span>{label}</span>
      {badge != null && badge > 0 ? (
        <span className="ml-auto animate-pulse rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

type Props = {
  atRiskCount?: number;
};

/** PC 백오피스 — 목업 `.sidebar` (224px, lg+) */
export function OpsSidebarNav({ atRiskCount = 0 }: Props) {
  const pathname = usePathname() ?? "";

  return (
    <aside
      className={`fixed top-0 left-0 z-[100] flex h-dvh w-56 shrink-0 flex-col border-r border-ops-border bg-ops-surface ${opsDesktopSidebarClass}`}
    >
      <div className="flex items-center gap-2.5 border-b border-ops-border px-5 py-5">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#5B6BF8] to-[#8B5CF6] text-[15px] font-black text-white shadow-[0_4px_12px_rgba(91,107,248,0.35)]">
          C
        </div>
        <div className="leading-none">
          <p className="text-[15px] font-black tracking-tight text-ops-text">CHAYA Admin</p>
          <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-[#4A5568]">플랫폼 관리자 콘솔</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3 scrollbar-none" aria-label="관리자 메뉴">
        <NavSectionLabel>메인</NavSectionLabel>
        {OPS_MAIN_NAV.map((tab) => (
          <NavItem
            key={tab.id}
            href={tab.href}
            label={tab.label}
            icon={TAB_ICONS[tab.id]}
            active={opsNavMatch(pathname, tab.id)}
            badge={tab.id === "stores" && atRiskCount > 0 ? atRiskCount : undefined}
          />
        ))}

        <NavSectionLabel>운영</NavSectionLabel>
        <NavItem
          href="/ops/settings"
          label="시스템 설정"
          icon={<Settings className="h-4 w-4" strokeWidth={2.25} />}
          active={pathname.startsWith("/ops/settings")}
        />
        {OPS_SECONDARY_NAV.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={
              item.href.includes("merchants") ? (
                <Users className="h-4 w-4" strokeWidth={2.25} />
              ) : (
                <ClipboardList className="h-4 w-4" strokeWidth={2.25} />
              )
            }
            active={pathname.startsWith(item.matchPrefix)}
          />
        ))}
        <NavItem
          href="/ops/settings#notice"
          label="공지 발송"
          icon={<Megaphone className="h-4 w-4" strokeWidth={2.25} />}
          active={false}
        />

        <NavSectionLabel>데이터</NavSectionLabel>
        <NavItem
          href="/ops/data"
          label="데이터 익스포트"
          icon={<BarChart3 className="h-4 w-4" strokeWidth={2.25} />}
          active={false}
        />
      </nav>

      <div className="border-t border-ops-border px-2.5 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-ops-surface-3">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#5B6BF8] to-[#8B5CF6] text-xs font-extrabold text-white">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-ops-text">CHAYA 관리자</p>
            <p className="text-[10px] font-semibold text-[#4A5568]">Super Admin</p>
          </div>
        </div>
        <form action="/ops/logout" method="post" className="mt-2">
          <button
            type="submit"
            className="w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-ops-muted transition hover:bg-ops-surface-3 hover:text-ops-text"
          >
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
