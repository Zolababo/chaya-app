"use client";

import type { ReactNode } from "react";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Settings,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { OPS_PRIMARY_NAV } from "@/lib/platform/ops-nav-items";
import { opsNavMatch, type OpsNavTab } from "@/lib/platform/ops-nav-paths";
import { chayaAppShellNavInnerClass } from "@/lib/responsive/chaya-app-shell";
import { chayaOpsShellClass, opsCompactNavClass } from "@/lib/responsive/chaya-ops-shell";

const TAB_ICONS: Record<OpsNavTab, ReactNode> = {
  dashboard: <LayoutDashboard className="h-5 w-5" strokeWidth={2.25} />,
  stores: <Building2 className="h-5 w-5" strokeWidth={2.25} />,
  data: <BarChart3 className="h-5 w-5" strokeWidth={2.25} />,
  revenue: <Wallet className="h-5 w-5" strokeWidth={2.25} />,
  settings: <Settings className="h-5 w-5" strokeWidth={2.25} />,
};

function Tab({
  href,
  active,
  label,
  icon,
  dot,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: ReactNode;
  dot?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 pt-1 text-[10px] font-bold sm:text-[11px]",
        active ? "text-[#5B6BF8]" : "text-ops-muted",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative" aria-hidden>
        {icon}
        {dot ? (
          <span className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-ops-surface" />
        ) : null}
      </span>
      <span>{label}</span>
    </Link>
  );
}

export function OpsBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-ops-border bg-ops-surface pb-[env(safe-area-inset-bottom)] ${opsCompactNavClass}`}
      aria-label="관리자 메뉴"
    >
      <div className={`${chayaAppShellNavInnerClass} ${chayaOpsShellClass} flex`}>
        {OPS_PRIMARY_NAV.map((tab) => (
          <Tab
            key={tab.id}
            href={tab.href}
            label={tab.label}
            icon={TAB_ICONS[tab.id]}
            active={opsNavMatch(pathname, tab.id)}
            dot={tab.id === "stores" && pathname.startsWith("/ops/stores")}
          />
        ))}
      </div>
    </nav>
  );
}
