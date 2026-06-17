"use client";

import { useState } from "react";

import { updateOrderStatusFromForm } from "@/app/m/[tenant]/orders/actions";
import {
  MERCHANT_CANCEL_REASONS,
  merchantCancelReasonLabel,
  type MerchantCancelReason,
} from "@/lib/orders/merchant-cancel-reasons";
import type { MerchantOrdersTab } from "@/lib/merchant/merchant-orders-tab";

type Props = {
  tenant: string;
  orderId: string;
  currentStatus: string;
  ordersTab: MerchantOrdersTab;
};

export function MerchantOrderCancelPanel({ tenant, orderId, currentStatus, ordersTab }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<MerchantCancelReason>("guest_change");

  if (!open) {
    return (
      <div className="flex justify-center pt-1">
        <button
          type="button"
          className="text-sm font-semibold text-red-600 underline-offset-2 hover:underline dark:text-red-400"
          onClick={() => setOpen(true)}
        >
          주문 취소
        </button>
      </div>
    );
  }

  return (
    <form
      action={updateOrderStatusFromForm}
      className="mt-2 rounded-xl border border-red-200 bg-red-50/80 p-3 dark:border-red-900 dark:bg-red-950/30"
    >
      <input type="hidden" name="tenant_slug" value={tenant} />
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="current_status" value={currentStatus} />
      <input type="hidden" name="status" value="cancelled" />
      <input type="hidden" name="orders_tab" value={ordersTab} />
      <input type="hidden" name="cancel_reason" value={reason} />

      <p className="text-sm font-semibold text-red-900 dark:text-red-100">취소 사유</p>
      <ul className="mt-2 space-y-1.5" role="radiogroup" aria-label="취소 사유 선택">
        {MERCHANT_CANCEL_REASONS.map((code) => (
          <li key={code}>
            <label className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-red-100/80 dark:hover:bg-red-950/50">
              <input
                type="radio"
                name="cancel_reason_ui"
                value={code}
                checked={reason === code}
                onChange={() => setReason(code)}
                className="h-4 w-4 shrink-0 accent-red-600"
              />
              <span className="text-sm font-medium text-red-950 dark:text-red-100">
                {merchantCancelReasonLabel(code)}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 dark:bg-red-500"
        >
          취소 확정
        </button>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-red-300 px-4 text-sm font-semibold text-red-800 dark:border-red-800 dark:text-red-200"
          onClick={() => setOpen(false)}
        >
          닫기
        </button>
      </div>
    </form>
  );
}
