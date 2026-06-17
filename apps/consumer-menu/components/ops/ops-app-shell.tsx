"use client";



import type { ReactNode } from "react";

import { usePathname } from "next/navigation";



import { OpsAppHeader } from "@/components/ops/ops-app-header";

import { OpsBottomNav } from "@/components/ops/ops-bottom-nav";

import { OpsSidebarNav } from "@/components/ops/ops-sidebar-nav";

import { OpsTopbar } from "@/components/ops/ops-topbar";

import type { PlatformNavBadges } from "@/lib/platform/get-platform-nav-badges";

import { isOpsConsolePath } from "@/lib/platform/ops-nav-paths";

import {

  opsCompactNavWrapClass,

  opsConsoleRootClass,

  opsMainColumnClass,

  opsMainScrollClass,

} from "@/lib/responsive/chaya-ops-shell";

import { useOpsDesktopView } from "@/lib/responsive/use-ops-wide-landscape";



type Props = {

  children: ReactNode;

  badges?: PlatformNavBadges;

};



/** PC·모바일 셸은 CSS `(hover)+(pointer)` 로 표시 전환 — SSR 깜빡임 방지 */

export function OpsAppShell({ children, badges }: Props) {

  const pathname = usePathname() ?? "";

  const isConsole = isOpsConsolePath(pathname);

  useOpsDesktopView();

  const alertCount = badges?.alertCount ?? 0;

  const atRiskCount = badges?.atRiskCount ?? 0;



  if (!isConsole) {

    return <>{children}</>;

  }



  return (

    <div className={`min-h-dvh bg-ops-bg ${opsConsoleRootClass}`}>

      <OpsSidebarNav atRiskCount={atRiskCount} />

      <div className={opsMainColumnClass}>

        <OpsTopbar alertCount={alertCount} />

        <OpsAppHeader alertCount={alertCount} />

        <div className={`flex-1 ${opsMainScrollClass}`}>{children}</div>

        <div className={opsCompactNavWrapClass}>

          <OpsBottomNav />

        </div>

      </div>

    </div>

  );

}


