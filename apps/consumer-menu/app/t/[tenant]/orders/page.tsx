import Link from "next/link";

import { ConsumerOfflinePaymentCallout } from "@/components/consumer-offline-payment-callout";
import { consumerLoginUrl } from "@/lib/consumer/consumer-path";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { listUserOrdersForTenant } from "@/lib/orders/list-user-orders";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

import { GuestOrdersHub } from "./guest-orders-hub";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ claimed?: string; lang?: string }>;
};

export default async function OrdersHubPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  const locale = await getConsumerLocale(typeof sp.lang === "string" ? sp.lang : null);
  const m = consumerMessages(locale);
  const claimed =
    typeof sp.claimed === "string" && sp.claimed !== "0"
      ? Math.max(0, Math.trunc(Number(sp.claimed)))
      : null;

  const supabase = await createSupabaseServerClient();
  const user = supabase ? await resolveServerUser(supabase) : null;
  const accountList = user ? await listUserOrdersForTenant(tenant) : null;

  return (
    <div className="mx-auto max-w-md space-y-6" aria-labelledby="orders-hub-heading">
      <div className="text-center">
        <h1 id="orders-hub-heading" className="text-2xl font-bold">
          {m.orders.pageTitle}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{m.orders.pageIntro}</p>
        <ConsumerOfflinePaymentCallout className="mt-3" />
      </div>

      {claimed != null && claimed > 0 ? (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"
        >
          {m.orders.claimed.replace("{count}", String(claimed))}
        </p>
      ) : null}

      {!user ? (
        <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-3 text-center text-sm dark:border-zinc-700 dark:bg-zinc-950">
          <Link
            href={consumerLoginUrl(tenant, withConsumerLang(`/t/${tenant}/orders`, locale))}
            className="font-semibold text-chaya-primary underline-offset-2 hover:underline"
          >
            {m.orders.login}
          </Link>{" "}
          {locale === "ko" ? "또는 " : " / "}
          <Link
            href={withConsumerLang(
              `/t/${tenant}/signup?next=${encodeURIComponent(withConsumerLang(`/t/${tenant}/orders`, locale))}`,
              locale,
            )}
            className="font-semibold text-chaya-primary underline-offset-2 hover:underline"
          >
            {m.orders.signup}
          </Link>
          {m.orders.loginTail}
        </p>
      ) : null}

      <GuestOrdersHub
        tenant={tenant}
        loggedIn={!!user}
        initialAccountOrders={accountList?.ok ? accountList.orders : []}
        accountLoadError={accountList && !accountList.ok ? accountList.errorKind : null}
      />
    </div>
  );
}
