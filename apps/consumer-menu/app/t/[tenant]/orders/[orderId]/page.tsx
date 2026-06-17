import { GuestOrderDetailSessionRetry } from "@/components/guest-order-detail-session-retry";
import { OrderDetailClient } from "@/components/order-detail-client";
import { chayaConsumerContentClass } from "@/lib/responsive/chaya-app-shell";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { fetchGuestOrder } from "@/lib/orders/fetch-guest-order";
import { resolveGuestOrderViewForLocale } from "@/lib/orders/resolve-order-lines-for-locale";

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
  const orderRaw = await fetchGuestOrder(tenant, orderId);
  const order = orderRaw ? await resolveGuestOrderViewForLocale(tenant, orderRaw, locale) : null;

  if (order == null) {
    return (
      <div className={`${chayaConsumerContentClass} text-center`} role="alert" aria-live="assertive">
        <GuestOrderDetailSessionRetry />
        <h1 id="order-not-found-heading" className="text-2xl font-bold">
          {m.orderDetail.notFoundTitle}
        </h1>
      </div>
    );
  }

  return <OrderDetailClient tenant={tenant} order={order} />;
}
