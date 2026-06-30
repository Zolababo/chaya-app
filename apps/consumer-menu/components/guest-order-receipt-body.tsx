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
  hideHeader?: boolean;
};

/** 주문내역 카드·상세 — 상단 「주문 내역」+번호, 시각, 품목(×수량), 합계 */
export function GuestOrderReceiptBody({
  order,
  locale,
  cardTitle,
  totalLabel,
  easyMode = false,
  hideHeader = false,
}: Props) {
  const orderNoText = formatConsumerOrderNo(order.order_no, order.id);
  const lineTextClass = easyMode ? "text-base leading-relaxed" : "text-sm";
  const lineQtyClass = easyMode ? "text-base font-semibold" : "text-sm font-medium";

  return (
    <div className={`space-y-2 ${easyMode ? "space-y-3 py-1" : ""}`}>
      {hideHeader ? null : (
        <div className="flex items-baseline justify-between gap-3 border-b border-zinc-200/90 pb-2 dark:border-zinc-700">
          <h3
            className={`font-bold text-zinc-800 dark:text-zinc-200 ${easyMode ? "text-lg" : "text-sm"}`}
          >
            {cardTitle}
          </h3>
          <span
            className={`shrink-0 font-bold tabular-nums leading-none text-zinc-900 dark:text-zinc-50 ${easyMode ? "text-2xl" : "text-xl"}`}
            aria-label={`${cardTitle} ${orderNoText}`}
          >
            {orderNoText}
          </span>
        </div>
      )}

      {order.created_at ? (
        <time
          dateTime={order.created_at}
          className={`block text-zinc-500 dark:text-zinc-400 ${easyMode ? "text-base font-medium" : "text-xs"}`}
        >
          {formatOrderDateTime(order.created_at, locale)}
        </time>
      ) : null}

      {order.lines.length > 0 ? (
        <ul className={`list-none pt-0.5 ${easyMode ? "space-y-2.5" : "space-y-2"}`}>
          {order.lines.map((line, i) => (
            <li
              key={`${line.name}-${i}`}
              className={`flex items-start justify-between gap-3 ${lineTextClass}`}
            >
              <span className="min-w-0 font-medium text-zinc-800 dark:text-zinc-200">
                {line.name}
                <span className={`text-zinc-500 dark:text-zinc-400 ${lineQtyClass}`}>
                  {" "}
                  × {line.quantity}
                </span>
              </span>
              <span
                className={`shrink-0 tabular-nums font-semibold text-zinc-900 dark:text-zinc-50 ${easyMode ? "text-lg" : ""}`}
              >
                {formatConsumerMoney(line.price * line.quantity, locale)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={`flex items-center justify-between border-t border-zinc-200/90 pt-2.5 dark:border-zinc-700 ${easyMode ? "pt-3 text-lg" : "text-sm"}`}
      >
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{totalLabel}</span>
        <span
          className={`font-bold tabular-nums text-zinc-900 dark:text-zinc-50 ${easyMode ? "text-xl" : "text-base"}`}
        >
          {formatConsumerMoney(order.total_price, locale)}
        </span>
      </div>
    </div>
  );
}
