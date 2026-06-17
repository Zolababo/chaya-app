"use client";

import { MerchantOrderQueueCard } from "@/components/merchant-order-queue-card";
import { MerchantOrderQueueCompactRow } from "@/components/merchant-order-queue-compact-row";
import type { MerchantOrderRow } from "@/lib/orders/list-orders-for-merchant";
import type { MerchantOrdersTab } from "@/lib/merchant/merchant-orders-tab";
import { MERCHANT_COOKING_STATUSES } from "@/lib/orders/merchant-status-constants";

type Props = {
  tenant: string;
  rows: MerchantOrderRow[];
  ordersTab: MerchantOrdersTab;
  canMutateOrders: boolean;
  /** 10분 초과 조리 주문 ID 목록 */
  delayedOrderIds?: string[];
  /** 가로 2-pane — compact 목록 */
  twoPane?: boolean;
  selectedOrderId?: string | null;
  onSelectOrder?: (orderId: string) => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-0.5 pb-1 pt-2">
      <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {children}
      </span>
      <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

const cookingSet = new Set(MERCHANT_COOKING_STATUSES as readonly string[]);

export function MerchantOrderQueueList({
  tenant,
  rows,
  ordersTab,
  canMutateOrders,
  delayedOrderIds,
  twoPane = false,
  selectedOrderId = null,
  onSelectOrder,
}: Props) {
  if (rows.length === 0) return null;

  const delayedIds = new Set(delayedOrderIds ?? []);

  const renderRow = (row: MerchantOrderRow) => {
    if (twoPane && onSelectOrder) {
      return (
        <MerchantOrderQueueCompactRow
          key={row.id}
          row={row}
          selected={selectedOrderId === row.id}
          isDelayed={delayedIds.has(row.id)}
          onSelect={onSelectOrder}
        />
      );
    }
    return (
      <MerchantOrderQueueCard
        key={row.id}
        tenant={tenant}
        row={row}
        ordersTab={ordersTab}
        canMutateOrders={canMutateOrders}
        delayedIds={delayedIds}
      />
    );
  };

  const listClass = twoPane ? "space-y-2" : "space-y-3";

  // "전체" 탭에서는 지위별 섹션 레이블 + 지연 주문 상단 배치
  if (ordersTab === "all") {
    const delayed = rows.filter((r) => delayedIds.has(r.id));
    const pending = rows.filter((r) => r.status === "pending");
    const cooking = rows.filter((r) => cookingSet.has(r.status) && !delayedIds.has(r.id));
    const ready = rows.filter((r) => r.status === "ready");

    return (
      <div className="space-y-1" aria-label="주문 목록">
        {/* 지연 주문 — 최상단 */}
        {delayed.length > 0 ? (
          <>
            <SectionLabel>⚠ 조리 지연</SectionLabel>
            <ul className={listClass}>
              {delayed.map((row) => renderRow(row))}
            </ul>
          </>
        ) : null}

        {/* 주문 접수 대기 */}
        {pending.length > 0 ? (
          <>
            <SectionLabel>주문 접수 대기</SectionLabel>
            <ul className={listClass}>
              {pending.map((row) => renderRow(row))}
            </ul>
          </>
        ) : null}

        {/* 조리 중 */}
        {cooking.length > 0 ? (
          <>
            <SectionLabel>조리 중</SectionLabel>
            <ul className={listClass}>
              {cooking.map((row) => renderRow(row))}
            </ul>
          </>
        ) : null}

        {/* 서빙완료 · 결제 대기 */}
        {ready.length > 0 ? (
          <>
            <SectionLabel>서빙완료 · 결제 대기</SectionLabel>
            <ul className={listClass}>
              {ready.map((row) => renderRow(row))}
            </ul>
          </>
        ) : null}
      </div>
    );
  }

  // 기타 탭 — 단순 리스트
  return (
    <ul className={listClass} aria-label="주문 목록">
      {rows.map((row) => renderRow(row))}
    </ul>
  );
}
