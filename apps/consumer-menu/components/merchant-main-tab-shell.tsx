"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { MerchantAnalyticsPageClient } from "@/components/merchant-analytics-page-client";
import { MerchantDashboardPageClient } from "@/components/merchant-dashboard-page-client";
import { MerchantMenusPageClient } from "@/components/merchant-menus-page-client";
import { MerchantOrdersPageClient } from "@/components/merchant-orders-page-client";
import { buildMerchantAnalyticsRequest } from "@/lib/merchant/merchant-analytics-request";
import {
  type MerchantMainTab,
  isMerchantMenusSubRoute,
  merchantMainTabFromPathname,
} from "@/lib/merchant/merchant-main-tab";
import { type MerchantMenusTab } from "@/lib/merchant/merchant-menus-href";
import { merchantDashboardAlertMessage } from "@/lib/merchant/merchant-owner-copy";
import {
  firstMerchantSearchParam,
  merchantOrdersTabHref,
  resolveOrdersTabFromSearchParams,
  type MerchantOrdersTab,
} from "@/lib/merchant/merchant-orders-tab";
import type { MerchantRole } from "@/lib/merchant/merchant-access";

type Props = {
  tenant: string;
  role: MerchantRole;
  canManageMenus: boolean;
  canMutateOrders: boolean;
  children: ReactNode;
};

function resolveMenusTab(tabParam: string | null, soldOutParam: string | null): MerchantMenusTab {
  if (tabParam === "selling" || tabParam === "soldout") return tabParam;
  if (soldOutParam === "1" || soldOutParam === "true") return "soldout";
  return "all";
}

function TabPanel({
  tab,
  activeTab,
  mounted,
  children,
}: {
  tab: MerchantMainTab;
  activeTab: MerchantMainTab;
  mounted: boolean;
  children: ReactNode;
}) {
  if (!mounted) return null;
  const visible = tab === activeTab;
  return (
    <div hidden={!visible} aria-hidden={!visible} className={visible ? undefined : "hidden"}>
      {children}
    </div>
  );
}

/** 4탭(홈·주문·메뉴·분석) 단일 SPA — 패널 유지, 서브 라우트는 children. */
export function MerchantMainTabShell({
  tenant,
  role,
  canManageMenus,
  canMutateOrders,
  children,
}: Props) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = merchantMainTabFromPathname(pathname, tenant);
  const menusSubRoute = activeTab === "menus" && isMerchantMenusSubRoute(pathname, tenant);

  const [visited, setVisited] = useState<Set<MerchantMainTab>>(() =>
    activeTab ? new Set([activeTab]) : new Set(),
  );

  useEffect(() => {
    if (!activeTab) return;
    setVisited((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const sp = useMemo(() => {
    const get = (key: string) => searchParams.get(key) ?? undefined;
    return {
      e: get("e"),
      ok: get("ok"),
      warn: get("warn"),
      hint: get("hint"),
      tab: get("tab"),
      sold_out: get("sold_out"),
      status: get("status"),
      bucket: get("bucket"),
      today: get("today"),
      days: get("days"),
      from: get("from"),
      to: get("to"),
      month: get("month"),
      lastmonth: get("lastmonth"),
    };
  }, [searchParams]);

  const ordersTab: MerchantOrdersTab = useMemo(
    () =>
      resolveOrdersTabFromSearchParams(sp.tab, {
        status: sp.status,
        bucket: sp.bucket,
        today: sp.today,
      }),
    [sp.tab, sp.status, sp.bucket, sp.today],
  );

  const analyticsQuery = useMemo(
    () => ({
      days: sp.days,
      from: sp.from,
      to: sp.to,
      month: sp.month,
      lastmonth: sp.lastmonth,
    }),
    [sp.days, sp.from, sp.to, sp.month, sp.lastmonth],
  );

  const { req: analyticsReq, isLastMonth } = useMemo(
    () => buildMerchantAnalyticsRequest(analyticsQuery),
    [analyticsQuery],
  );

  const dashAlert = useMemo(
    () => merchantDashboardAlertMessage(sp.e)?.trim() ?? undefined,
    [sp.e],
  );

  useEffect(() => {
    if (activeTab !== "orders") return;
    if (sp.tab?.trim()) return;
    router.replace(merchantOrdersTabHref(tenant, "all"));
  }, [activeTab, sp.tab, tenant, router]);

  useEffect(() => {
    if (activeTab !== "menus" || canManageMenus) return;
    router.replace(`/m/${encodeURIComponent(tenant)}/dashboard?e=no_menus_access`);
  }, [activeTab, canManageMenus, tenant, router]);

  if (!activeTab) {
    return <>{children}</>;
  }

  return (
    <>
      <TabPanel tab="dashboard" activeTab={activeTab} mounted={visited.has("dashboard")}>
        <MerchantDashboardPageClient tenant={tenant} dashAlert={dashAlert} />
      </TabPanel>

      <TabPanel tab="orders" activeTab={activeTab} mounted={visited.has("orders")}>
        <MerchantOrdersPageClient
          tenant={tenant}
          canMutateOrders={canMutateOrders}
          activeTab={ordersTab}
          errCode={sp.e}
          okCode={sp.ok}
          legacyStatus={sp.status}
          legacyBucket={sp.bucket}
          legacyToday={sp.today}
        />
      </TabPanel>

      <TabPanel tab="menus" activeTab={activeTab} mounted={visited.has("menus")}>
        {menusSubRoute ? (
          children
        ) : (
          <MerchantMenusPageClient
            tenant={tenant}
            activeTab={resolveMenusTab(sp.tab ?? null, sp.sold_out ?? null)}
            errCode={sp.e}
            okCode={sp.ok}
            warnCode={sp.warn}
            hintCode={sp.hint}
          />
        )}
      </TabPanel>

      <TabPanel tab="analytics" activeTab={activeTab} mounted={visited.has("analytics")}>
        <MerchantAnalyticsPageClient
          tenant={tenant}
          role={role}
          query={analyticsQuery}
          currentDays={analyticsReq.kind === "period" ? analyticsReq.days : null}
          currentFrom={analyticsReq.kind === "range" ? analyticsReq.from : null}
          currentTo={analyticsReq.kind === "range" ? analyticsReq.to : null}
          currentMonth={analyticsReq.kind === "month"}
          isLastMonth={isLastMonth}
        />
      </TabPanel>
    </>
  );
}
