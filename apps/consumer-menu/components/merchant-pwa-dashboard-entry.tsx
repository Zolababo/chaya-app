"use client";

import { useEffect } from "react";

import { merchantMainTabFromPathname, merchantMainTabHref } from "@/lib/merchant/merchant-main-tab";

type Props = {
  tenant: string;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

/** PWA 홈 화면 아이콘 cold start — 마지막 탭(메뉴 등) 대신 홈(대시보드)으로 */
export function MerchantPwaDashboardEntry({ tenant }: Props) {
  useEffect(() => {
    if (!isStandaloneDisplay()) return;

    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav?.type !== "navigate") return;

    const activeTab = merchantMainTabFromPathname(window.location.pathname, tenant);
    if (!activeTab || activeTab === "dashboard") return;

    window.location.replace(merchantMainTabHref(tenant, "dashboard"));
  }, [tenant]);

  return null;
}
