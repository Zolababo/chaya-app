import Link from "next/link";

import { CopyCurrentOrderUrlButton } from "@/components/copy-current-order-url-button";
import { GuestOrderDetailSessionRetry } from "@/components/guest-order-detail-session-retry";
import { GuestOrderStatusLive } from "@/components/guest-order-status-live";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { fetchGuestOrder } from "@/lib/orders/fetch-guest-order";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string; orderId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function OrderStatusPage({ params, searchParams }: Props) {
  const { tenant, orderId } = await params;
  const sp = await searchParams;
  const locale = await getConsumerLocale(typeof sp.lang === "string" ? sp.lang : null);
  const m = consumerMessages(locale);
  const order = await fetchGuestOrder(tenant, orderId);

  if (order == null) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center" role="alert" aria-live="assertive">
        <GuestOrderDetailSessionRetry />
        <h1 id="order-not-found-heading" className="text-2xl font-bold">
          {m.orderDetail.notFoundTitle}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{m.orderDetail.notFoundBody}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{m.orderDetail.notFoundRpc}</p>
        <Link
          href={withConsumerLang(`/t/${tenant}/cart`, locale)}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-chaya-primary px-6 py-3 font-semibold text-chaya-on-primary"
          aria-label={m.orderDetail.toCartAria}
        >
          {m.orderDetail.toCart}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8" aria-labelledby="order-received-heading">
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-200 text-3xl dark:bg-green-900"
          aria-hidden
        >
          ✓
        </div>
        <p className="sr-only">{m.orderDetail.receivedSr}</p>
        <h1 id="order-received-heading" className="text-2xl font-bold">
          {m.orderDetail.receivedTitle}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {m.orderDetail.orderNo}{" "}
          <span className="font-mono font-semibold">{order.id.slice(0, 8)}</span>…
        </p>
        {order.created_at ? (
          <p className="mt-1 text-sm text-zinc-500">{new Date(order.created_at).toLocaleString()}</p>
        ) : null}
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-600 dark:text-zinc-400">{m.orderDetail.revisitHint}</p>
        <CopyCurrentOrderUrlButton />
        <GuestOrderStatusLive tenant={tenant} orderId={order.id} initialStatus={order.status} />
      </div>

      {(order.table_no || order.guest_note) && (
        <div
          className="rounded-xl border border-chaya-border bg-chaya-surface p-4 text-left dark:border-zinc-700 dark:bg-zinc-950"
          aria-label={m.orderDetail.metaLabel}
        >
          {order.table_no ? (
            <p className="text-sm">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">{m.orderDetail.tableLabel}</span>{" "}
              <span className="font-semibold">{order.table_no}</span>
            </p>
          ) : null}
          {order.guest_note ? (
            <p className={`text-sm ${order.table_no ? "mt-2" : ""}`}>
              <span className="font-medium text-zinc-600 dark:text-zinc-400">{m.orderDetail.requestLabel}</span>{" "}
              <span className="whitespace-pre-wrap">{order.guest_note}</span>
            </p>
          ) : null}
        </div>
      )}

      <div className="rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <h2 id="order-lines-heading" className="mb-3 font-semibold text-zinc-800 dark:text-zinc-200">
          {m.orderDetail.linesHeading}
        </h2>
        <ul className="divide-y divide-chaya-border dark:divide-zinc-800" aria-labelledby="order-lines-heading">
          {order.lines.map((line, i) => (
            <li key={`${line.name}-${i}`} className="flex justify-between py-2 text-sm">
              <span>
                {line.name} <span className="text-zinc-500">× {line.quantity}</span>
              </span>
              <span className="tabular-nums">{formatConsumerMoney(line.price * line.quantity, locale)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-chaya-border pt-3 font-semibold dark:border-zinc-800">
          <span>{m.orderDetail.total}</span>
          <span className="tabular-nums">{formatConsumerMoney(order.total_price, locale)}</span>
        </div>
      </div>

      <nav className="flex flex-wrap justify-center gap-3" aria-label={m.orderDetail.toOrdersAria}>
        <Link
          href={withConsumerLang(`/t/${tenant}/orders`, locale)}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-6 py-3 font-semibold text-chaya-primary dark:border-zinc-700"
          aria-label={m.orderDetail.toOrdersAria}
        >
          {m.orderDetail.toOrders}
        </Link>
        <Link
          href={withConsumerLang(`/t/${tenant}`, locale)}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-6 py-3 font-semibold text-chaya-primary dark:border-zinc-700"
          aria-label={m.orderDetail.toMenuAria}
        >
          {m.orderDetail.toMenu}
        </Link>
      </nav>
    </div>
  );
}
