"use client";

import Link from "next/link";

import { GuestOrderReceiptBody } from "@/components/guest-order-receipt-body";
import { GuestOrderStatusPill } from "@/components/guest-order-status-pill";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { formatConsumerOrderNo } from "@/lib/orders/format-order-no";
import type { GuestOrderListItem } from "@/lib/orders/list-guest-orders";
import type { AppLocale } from "@/lib/i18n/locales";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";

type Props = {
  tenant: string;
  order: GuestOrderListItem;
  locale: AppLocale;
  totalLabel: string;
  cardTitle: string;
  linkAria: string;
  easyMode?: boolean;
  cancelledNotice?: string;
};

export function GuestOrderHistoryCard({
  tenant,
  order,
  locale,
  totalLabel,
  cardTitle,
  linkAria,
  easyMode = false,
  cancelledNotice,
}: Props) {
  const navHref = useConsumerNavHref(tenant);
  const href = navHref(`/t/${tenant}/orders/${order.id}`);
  const orderNoText = formatConsumerOrderNo(order.order_no, order.id);
  const isCancelled = order.status.trim().toLowerCase() === "cancelled";

  return (
    <article
      className={`overflow-hidden rounded-xl bg-chaya-surface shadow-sm ring-1 ring-black/[0.03] dark:bg-zinc-900 dark:ring-white/5 ${isCancelled ? "opacity-90" : ""}`}
    >
      <Link
        href={href}
        className={`block px-3 py-3 transition active:opacity-90 ${easyMode ? "min-h-[48px]" : ""}`}
        aria-label={`${cardTitle} ${orderNoText}, ${formatConsumerMoney(order.total_price, locale)}, ${linkAria}`}
      >
        {cancelledNotice ? (
          <p
            role="status"
            className="mb-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
          >
            {cancelledNotice}
          </p>
        ) : null}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`font-extrabold text-zinc-900 dark:text-zinc-50 ${easyMode ? "text-lg" : "text-base"}`}
            >
              {orderNoText}
            </p>
          </div>
          <GuestOrderStatusPill status={order.status} />
        </div>
        <GuestOrderReceiptBody
          order={order}
          locale={locale}
          cardTitle={cardTitle}
          totalLabel={totalLabel}
          easyMode={easyMode}
          hideHeader
        />
      </Link>
    </article>
  );
}
