"use client";

import { useEffect, useMemo, useState } from "react";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { ConsumerOfflinePaymentCallout } from "@/components/consumer-offline-payment-callout";
import { GuestOrderReceiptBody } from "@/components/guest-order-receipt-body";
import { GuestOrderStatusPill } from "@/components/guest-order-status-pill";
import { OrderProgressSteps } from "@/components/order-progress-steps";
import { SplitBillPanel } from "@/components/split-bill-panel";
import { chayaSurfaceCardPaddedClass } from "@/components/menu-list-styles";
import { CONSUMER_SPLIT_BILL_UI_VISIBLE } from "@/lib/consumer/future-features";
import { consumeFreshOrderView } from "@/lib/consumer/fresh-order-view";
import { syncGuestSessionCookieFromBrowser } from "@/lib/guest-session/sync-guest-session-cookie";
import type { GuestOrderView } from "@/lib/orders/fetch-guest-order";
import { chayaConsumerContentClass } from "@/lib/responsive/chaya-app-shell";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

type Props = {
  tenant: string;
  order: GuestOrderView;
};

export function OrderDetailClient({ tenant, order }: Props) {
  const router = useRouter();
  const { locale, m } = useConsumerLocale();
  const [isFreshView, setIsFreshView] = useState(false);
  const [freshOrderNo, setFreshOrderNo] = useState<number | null>(null);

  useEffect(() => {
    const { fresh, orderNo } = consumeFreshOrderView(tenant, order.id);
    setIsFreshView(fresh);
    setFreshOrderNo(orderNo);
  }, [tenant, order.id]);

  const displayOrder = useMemo(() => {
    const no =
      order.order_no != null && order.order_no > 0
        ? order.order_no
        : freshOrderNo;
    if (no == null || no === order.order_no) return order;
    return { ...order, order_no: no };
  }, [order, freshOrderNo]);

  useEffect(() => {
    if (displayOrder.order_no != null && displayOrder.order_no > 0) return;
    syncGuestSessionCookieFromBrowser();
    router.refresh();
  }, [displayOrder.order_no, router]);

  const showSplitBill =
    CONSUMER_SPLIT_BILL_UI_VISIBLE && !isFreshView && order.total_price > 0;

  return (
    <div
      className={`${chayaConsumerContentClass} space-y-4 ${showSplitBill ? "pb-4" : "pb-2"}`}
      aria-label={m.orders.pageTitle}
    >
      {isFreshView ? (
        <div className="space-y-4" role="status" aria-live="polite">
          <div
            className={`${chayaSurfaceCardPaddedClass} flex flex-col items-center gap-3 py-6 text-center sm:py-7`}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md dark:bg-emerald-500"
              aria-hidden
            >
              <Check className="size-8" strokeWidth={2.5} />
            </span>
            <p className="text-lg font-extrabold leading-snug text-zinc-900 dark:text-zinc-50">
              {m.orderDetail.placedTitle}
            </p>
            <p className="text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
              {m.orderDetail.placedSubtitle}
            </p>
            <span className="sr-only">{m.orderDetail.receivedSr}</span>
          </div>

          <OrderProgressSteps status={displayOrder.status} />
          <ConsumerOfflinePaymentCallout variant="prominent" />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-1">
          <GuestOrderStatusPill status={displayOrder.status} />
        </div>
      )}

      <div className={`${chayaSurfaceCardPaddedClass} sm:p-5`}>
        <GuestOrderReceiptBody
          order={displayOrder}
          locale={locale}
          cardTitle={m.orderDetail.linesHeading}
          totalLabel={m.orderDetail.total}
        />
      </div>

      {order.guest_note ? (
        <div className={`${chayaSurfaceCardPaddedClass} text-left text-sm`}>
          <p>
            <span className="font-medium text-zinc-600 dark:text-zinc-400">{m.orderDetail.requestLabel}</span>{" "}
            <span className="whitespace-pre-wrap">{order.guest_note}</span>
          </p>
        </div>
      ) : null}

      {showSplitBill ? <SplitBillPanel total={order.total_price} /> : null}
    </div>
  );
}
