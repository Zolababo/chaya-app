"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";

import { MerchantLoadingCenter } from "@/components/merchant-loading-center";
import { MerchantOrdersTabs } from "@/components/merchant-orders-tabs";
import { MerchantOrdersToolbar } from "@/components/merchant-orders-toolbar";
import {
  invalidateMerchantCacheForTenant,
  merchantCacheKey,
} from "@/lib/merchant/merchant-client-cache";
import {
  merchantOrdersTabLabel,
  type MerchantOrdersTab,
} from "@/lib/merchant/merchant-orders-tab";
import { parseMerchantLiveOrders } from "@/lib/merchant/merchant-live-types";
import { useMerchantLiveFetch } from "@/lib/merchant/use-merchant-live-fetch";

const MerchantOrdersQueuePane = dynamic(
  () =>
    import("@/components/merchant-orders-queue-pane").then((m) => m.MerchantOrdersQueuePane),
  { loading: () => <MerchantLoadingCenter context="orders" compact className="py-8" /> },
);

type Props = {
  tenant: string;
  canMutateOrders: boolean;
  activeTab: MerchantOrdersTab;
  errCode?: string;
  okCode?: string;
  legacyStatus?: string;
  legacyBucket?: string;
  legacyToday?: string;
};

export function MerchantOrdersPageClient({
  tenant,
  canMutateOrders,
  activeTab,
  errCode,
  okCode,
  legacyStatus,
  legacyBucket,
  legacyToday,
}: Props) {
  const tEnc = encodeURIComponent(tenant);
  const query = new URLSearchParams({ tab: activeTab });
  if (legacyStatus) query.set("status", legacyStatus);
  if (legacyBucket) query.set("bucket", legacyBucket);
  if (legacyToday) query.set("today", legacyToday);

  const cacheKey = merchantCacheKey(tenant, "orders", activeTab);
  const url = `/m/${tEnc}/live/orders?${query.toString()}`;

  const { data, error, isRefreshing } = useMerchantLiveFetch({
    tenant,
    cacheKey,
    url,
    invalidateScope: "orders",
    parse: parseMerchantLiveOrders,
  });

  useEffect(() => {
    if (okCode || errCode) {
      invalidateMerchantCacheForTenant(tenant, "orders");
    }
  }, [okCode, errCode, tenant]);

  const ops = data?.ops;

  const tabCounts = ops
    ? {
        pending: ops.pending,
        cooking: ops.cooking,
        ready: ops.ready,
        todayPaid: ops.todayPaid,
        todayCancelled: ops.todayCancelled,
      }
    : { pending: 0, cooking: 0, ready: 0, todayPaid: 0, todayCancelled: 0 };

  const toolbarSummary = ops
    ? {
        pending: ops.pending,
        cooking: ops.cooking,
        ready: ops.ready,
        todayPaid: ops.todayPaid,
        delayedCount: ops.delayedCount,
      }
    : { pending: 0, cooking: 0, ready: 0, todayPaid: 0, delayedCount: 0 };

  const emptyMessage = useMemo(() => {
    switch (activeTab) {
      case "all":
        return "현재 처리 중인 주문이 없습니다.";
      case "pending":
        return "주문이 없습니다.";
      case "cooking":
        return "조리 중인 주문이 없습니다.";
      case "ready":
        return "서빙 완료 대기 주문이 없습니다.";
      case "paid":
        return "오늘 결제 완료된 주문이 없습니다.";
      default:
        return "오늘 취소된 주문이 없습니다.";
    }
  }, [activeTab]);

  const loadError = error ?? (data == null && !isRefreshing ? "주문을 불러오지 못했습니다." : null);

  return (
    <>
      <MerchantOrdersTabs tenant={tenant} active={activeTab} counts={tabCounts} />
      <MerchantOrdersToolbar summary={toolbarSummary} />

      <MerchantOrdersQueuePane
        tenant={tenant}
        canMutateOrders={canMutateOrders}
        activeTab={activeTab}
        errCode={errCode}
        okCode={okCode}
        data={data}
        isRefreshing={isRefreshing}
        loadError={loadError}
        emptyMessage={emptyMessage}
      />

      <p className="sr-only" aria-live="polite">
        {merchantOrdersTabLabel(activeTab)} 탭
      </p>
    </>
  );
}
