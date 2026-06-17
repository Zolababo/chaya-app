"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MerchantLoadingCenter } from "@/components/merchant-loading-center";
import { MerchantOrderQueueCard } from "@/components/merchant-order-queue-card";
import { MerchantOrderQueueList } from "@/components/merchant-order-queue-list";
import { MerchantOrdersDetailEmpty } from "@/components/merchant-orders-detail-empty";
import { MerchantOrdersTabs } from "@/components/merchant-orders-tabs";
import { MerchantOrdersBatchAccept } from "@/components/merchant-orders-batch-accept";
import { MerchantOrdersToolbar } from "@/components/merchant-orders-toolbar";
import { MerchantActionToast } from "@/components/merchant-action-toast";
import { MerchantPendingDeltaNotice } from "@/components/merchant-pending-delta-notice";
import {
  merchantOrdersActionErrorMessage,
  merchantOrdersActionSuccessMessage,
  merchantOwnerLoadErrorMessage,
} from "@/lib/merchant/merchant-owner-copy";
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
import { useMerchantWideLandscape } from "@/lib/responsive/use-merchant-wide-landscape";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const wideLandscape = useMerchantWideLandscape();
  const selectedOrderId = searchParams.get("order")?.trim() || null;

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

  const errMsg = merchantOrdersActionErrorMessage(errCode);
  const okMsg = merchantOrdersActionSuccessMessage(okCode);

  const ops = data?.ops;
  const pendingCount = ops?.pending ?? null;

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

  const delayedOrderIds = ops?.delayedOrderIds ?? [];
  const rows = useMemo(() => data?.rows ?? [], [data?.rows]);
  const delayedIds = useMemo(() => new Set(delayedOrderIds), [delayedOrderIds]);

  const selectedRow = useMemo(
    () => rows.find((r) => r.id === selectedOrderId) ?? null,
    [rows, selectedOrderId],
  );

  const selectOrder = useCallback(
    (orderId: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("order", orderId);
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!wideLandscape || rows.length === 0) return;
    if (selectedOrderId && rows.some((r) => r.id === selectedOrderId)) return;
    selectOrder(rows[0]!.id);
  }, [wideLandscape, rows, selectedOrderId, selectOrder]);

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

      <div className="mt-3">
        {activeTab === "pending" || activeTab === "all" ? (
          <MerchantPendingDeltaNotice tenantSlug={tenant} pendingCount={pendingCount} />
        ) : null}

        {(activeTab === "pending" || activeTab === "all") &&
        canMutateOrders &&
        typeof pendingCount === "number" &&
        pendingCount > 0 ? (
          <MerchantOrdersBatchAccept tenant={tenant} pendingCount={pendingCount} />
        ) : null}

        {errMsg ? <MerchantActionToast message={errMsg} kind="error" /> : null}
        {okMsg ? <MerchantActionToast message={okMsg} kind="ok" /> : null}

        {!data && isRefreshing ? <MerchantLoadingCenter context="orders" /> : null}

        {loadError ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            {merchantOwnerLoadErrorMessage("orders", loadError)}
          </p>
        ) : data && rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">{emptyMessage}</p>
        ) : data ? (
          <div className={wideLandscape && rows.length > 0 ? "merchant-orders-two-pane" : undefined}>
            <div className="merchant-orders-list-pane">
              <MerchantOrderQueueList
                tenant={tenant}
                rows={rows}
                ordersTab={activeTab}
                canMutateOrders={canMutateOrders}
                delayedOrderIds={delayedOrderIds}
                twoPane={wideLandscape}
                selectedOrderId={selectedOrderId}
                onSelectOrder={wideLandscape ? selectOrder : undefined}
              />
            </div>
            {wideLandscape && rows.length > 0 ? (
              <aside className="merchant-orders-detail-pane" aria-label="주문 상세">
                {selectedRow ? (
                  <MerchantOrderQueueCard
                    tenant={tenant}
                    row={selectedRow}
                    ordersTab={activeTab}
                    canMutateOrders={canMutateOrders}
                    delayedIds={delayedIds}
                  />
                ) : (
                  <MerchantOrdersDetailEmpty />
                )}
              </aside>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {merchantOrdersTabLabel(activeTab)} 탭
      </p>
    </>
  );
}
