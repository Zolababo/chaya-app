import { ConsumerOrderFlowBanner } from "@/components/consumer-order-flow-banner";
import { ConsumerOfflinePaymentCallout } from "@/components/consumer-offline-payment-callout";
import { PREF_TABLE_MAX } from "@/lib/cart/table-pref";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { listMenusForTenant } from "@/lib/menus/queries";

import { CartCheckoutClient } from "./cart-checkout-client";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ table?: string | string[]; lang?: string | string[] }>;
};

export default async function CartPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  const tableRaw = sp.table;
  const tableFromUrl =
    typeof tableRaw === "string" ? tableRaw.trim().slice(0, PREF_TABLE_MAX) : "";
  const langRaw = sp.lang;
  const locale = await getConsumerLocale(typeof langRaw === "string" ? langRaw : null);
  const m = consumerMessages(locale);
  const menu = await listMenusForTenant(tenant);

  return (
    <div className="space-y-6" aria-labelledby="cart-page-heading">
      <ConsumerOrderFlowBanner steps={[m.flow.step1, m.flow.step2, m.flow.step3]} activeStep={2} />

      <div>
        <h1 id="cart-page-heading" className="text-2xl font-bold tracking-tight">
          {m.cart.pageTitle}
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{m.cart.pageIntro}</p>
        <ConsumerOfflinePaymentCallout className="mt-3" />
      </div>

      {menu.notice ? (
        <p
          role={menu.ok ? "status" : "alert"}
          aria-live={menu.ok ? "polite" : "assertive"}
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {menu.notice}
        </p>
      ) : null}

      <CartCheckoutClient
        key={tenant}
        tenant={tenant}
        initialLines={[]}
        initialTableHint={tableFromUrl || null}
      />
    </div>
  );
}
