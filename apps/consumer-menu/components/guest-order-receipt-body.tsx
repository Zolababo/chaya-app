import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { formatOrderDateTime } from "@/lib/orders/format-order-datetime";
import { formatConsumerOrderNo } from "@/lib/orders/format-order-no";
import type { GuestOrderLineView } from "@/lib/orders/fetch-guest-order";
import type { AppLocale } from "@/lib/i18n/locales";

export type GuestOrderReceiptData = {
  id: string;
  order_no: number | null;
  total_price: number;
  created_at: string | null;
  lines: GuestOrderLineView[];
};

type Props = {
  order: GuestOrderReceiptData;
  locale: AppLocale;
  cardTitle: string;
  totalLabel: string;
  easyMode?: boolean;
  screenReaderMode?: boolean;
  hideHeader?: boolean;
};

/** 주문내역 카드·상세 — 상단 「주문 내역」+번호, 시각, 품목(×수량), 합계 */
export function GuestOrderReceiptBody({
  order,
  locale,
  cardTitle,
  totalLabel,
  easyMode = false,
  screenReaderMode = false,
  hideHeader = false,
}: Props) {
  const sr = easyMode || screenReaderMode;
  const orderNoText = formatConsumerOrderNo(order.order_no, order.id);
  const textSize = "text-sm";

  return (
    <div className={`space-y-2 ${sr ? "py-1" : ""}`}>
      {hideHeader ? null : (
        <div className="flex items-baseline justify-between gap-3 border-b border-zinc-200/90 pb-2 dark:border-zinc-700">
          <h3
            className={`font-bold text-zinc-800 dark:text-zinc-200 ${sr ? "text-base" : "text-sm"}`}
          >
            {cardTitle}
          </h3>
          <span
            className={`shrink-0 font-bold tabular-nums leading-none text-zinc-900 dark:text-zinc-50 ${sr ? "text-2xl" : "text-xl"}`}
            aria-label={`${cardTitle} ${orderNoText}`}
          >
            {orderNoText}
          </span>
        </div>
      )}

      {order.created_at ? (
        <time
          dateTime={order.created_at}
          className={`block text-zinc-500 dark:text-zinc-400 ${sr ? "text-sm" : "text-xs"}`}
        >
          {formatOrderDateTime(order.created_at, locale)}
        </time>
      ) : null}

      {order.lines.length > 0 ? (
        <ul className="list-none space-y-2 pt-0.5">
          {order.lines.map((line, i) => (
            <li
              key={`${line.name}-${i}`}
              className={`flex items-start justify-between gap-3 ${textSize}`}
            >
              <span className="min-w-0 text-zinc-800 dark:text-zinc-200">
                {line.name}
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  {" "}
                  × {line.quantity}
                </span>
              </span>
              <span className="shrink-0 tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                {formatConsumerMoney(line.price * line.quantity, locale)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={`flex items-center justify-between border-t border-zinc-200/90 pt-2.5 dark:border-zinc-700 ${sr ? "text-base" : "text-sm"}`}
      >
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{totalLabel}</span>
        <span className="text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {formatConsumerMoney(order.total_price, locale)}
        </span>
      </div>
    </div>
  );
}
