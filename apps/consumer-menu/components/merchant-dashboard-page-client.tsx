"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { MerchantHomeMenuQuickCard } from "@/components/merchant-home-menu-quick-card";
import { MerchantHomeOpsCard } from "@/components/merchant-home-ops-card";
import { MerchantHomeSalesCard } from "@/components/merchant-home-sales-card";
import { MerchantHomeUrgentBanner } from "@/components/merchant-home-urgent-banner";
import { MerchantLoadingCenter } from "@/components/merchant-loading-center";
import { merchantOwnerLoadErrorMessage } from "@/lib/merchant/merchant-owner-copy";
import { merchantCacheKey } from "@/lib/merchant/merchant-client-cache";
import { merchantMainTabHref } from "@/lib/merchant/merchant-main-tab";
import { scheduleMerchantHomePrefetches } from "@/lib/merchant/merchant-live-prefetch";
import { parseMerchantLiveDashboard } from "@/lib/merchant/merchant-live-types";
import { useMerchantLiveFetch } from "@/lib/merchant/use-merchant-live-fetch";

type Props = {
  tenant: string;
  dashAlert?: string;
};

export function MerchantDashboardPageClient({ tenant, dashAlert }: Props) {
  const router = useRouter();
  const tEnc = encodeURIComponent(tenant);
  const cacheKey = merchantCacheKey(tenant, "dashboard");
  const url = `/m/${tEnc}/live/dashboard`;

  const { data, error, isRefreshing } = useMerchantLiveFetch({
    tenant,
    cacheKey,
    url,
    invalidateScope: "dashboard",
    parse: parseMerchantLiveDashboard,
  });

  const loadError = error ?? (data == null && !isRefreshing ? "홈 정보를 불러오지 못했습니다." : null);
  const opsCounts = data?.ops;
  const todayMetrics = data?.metrics;
  const menuItems = data?.menuItems ?? [];

  useEffect(() => {
    if (!data?.ok) return;
    router.prefetch(merchantMainTabHref(tenant, "orders"));
    scheduleMerchantHomePrefetches(tenant);
  }, [data, router, tenant]);

  return (
    <>
      {dashAlert ? (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {dashAlert}
        </p>
      ) : null}

      {!data && !loadError ? <MerchantLoadingCenter context="dashboard" /> : null}

      {loadError ? (
        <p
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {loadError}
        </p>
      ) : null}

      {data ? (
        <div className="space-y-3">
          {opsCounts?.ok ? (
            <MerchantHomeUrgentBanner
              tenant={tenant}
              pendingCount={opsCounts.pending}
              delayedCount={opsCounts.delayedCount}
            />
          ) : null}

          {opsCounts && !opsCounts.ok ? (
            <p
              role="alert"
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            >
              {opsCounts.message}
            </p>
          ) : opsCounts?.ok ? (
            <MerchantHomeOpsCard tenant={tenant} counts={opsCounts} />
          ) : null}

          {todayMetrics?.ok ? (
            <MerchantHomeSalesCard tenant={tenant} metrics={todayMetrics} />
          ) : todayMetrics && !todayMetrics.ok ? (
            <p
              role="status"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {merchantOwnerLoadErrorMessage("metrics", todayMetrics.message)}
            </p>
          ) : null}

          {data.canManageMenus && menuItems.length > 0 ? (
            <MerchantHomeMenuQuickCard tenant={tenant} items={menuItems} />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
