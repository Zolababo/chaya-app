import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";

import { CartCheckoutClient } from "./cart-checkout-client";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ table?: string | string[]; lang?: string | string[] }>;
};

export default async function CartPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  const langRaw = sp.lang;
  const locale = await getConsumerLocale(typeof langRaw === "string" ? langRaw : null);
  const m = consumerMessages(locale);

  return (
    <div aria-label={m.cart.pageTitle}>
      <h1 className="sr-only">{m.cart.pageTitle}</h1>
      <p className="sr-only">{m.cart.listLabel}</p>
      <p className="sr-only">{m.payment.offlineLead}</p>
      <CartCheckoutClient key={tenant} tenant={tenant} initialLines={[]} categoryOrder={[]} />
    </div>
  );
}
