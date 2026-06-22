"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MerchantLoadingCenter } from "@/components/merchant-loading-center";
import { MerchantOrderQueueCard } from "@/components/merchant-order-queue-card";
import { MerchantOrderQueueList } from "@/components/merchant-order-queue-list";
import { MerchantOrdersDetailEmpty } from "@/components/merchant-orders-detail-empty";
import { MerchantOrdersBatchAccept } from "@/components/merchant-orders-batch-accept";
import { MerchantActionToast } from "@/components/merchant-action-toast";
import { MerchantPendingDeltaNotice } from "@/components/merchant-pending-delta-notice";
import {
  merchantOrdersActionErrorMessage,
  merchantOrdersActionSuccessMessage,
  merchantOwnerLoadErrorMessage,
} from "@/lib/merchant/merchant-owner-copy";
import type { MerchantLiveOrdersPayload } from "@/lib/merchant/merchant-live-types";
import type { MerchantOrdersTab } from "@/lib/merchant/merchant-orders-tab";
import { useMerchantWideLandscape } from "@/lib/responsive/use-merchant-wide-landscape";

export type MerchantOrdersQueuePaneProps = {
  tenant: string;
  canMutateOrders: boolean;
  activeTab: MerchantOrdersTab;
  errCode?: string;
  okCode?: string;
  data: MerchantLiveOrdersPayload | null;
  isRefreshing: boolean;
  loadError: string | null;
  emptyMessage: string;
};

/** 주문 목록·카드·일괄수락 — 무거운 UI (lazy chunk) */
export function MerchantOrdersQueuePane({
  tenant,
  canMutateOrders,
  activeTab,
  errCode,
  okCode,
  data,
  isRefreshing,
  loadError,
  emptyMessage,
}: MerchantOrdersQueuePaneProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wideLandscape = useMerchantWideLandscape();
  const selectedOrderId = searchParams.get("order")?.trim() || null;

  const errMsg = merchantOrdersActionErrorMessage(errCode);
  const okMsg = merchantOrdersActionSuccessMessage(okCode);

  const ops = data?.ops;
  const pendingCount = ops?.pending ?? null;
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

  return (
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
  );
}
