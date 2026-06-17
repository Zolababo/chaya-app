import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { readGuestSessionIdFromCookies } from "@/lib/guest-session/read-guest-session-cookie";
import { listGuestOrdersForTenant } from "@/lib/orders/list-guest-orders";
import { listUserOrdersForTenant } from "@/lib/orders/list-user-orders";
import { resolveGuestOrderListForLocale } from "@/lib/orders/resolve-order-lines-for-locale";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

import { GuestOrdersHub } from "./guest-orders-hub";
import { chayaConsumerContentClass } from "@/lib/responsive/chaya-app-shell";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function OrdersHubPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  const locale = await getConsumerLocale(typeof sp.lang === "string" ? sp.lang : null);
  const m = consumerMessages(locale);

  const supabase = await createSupabaseServerClient();
  const user = supabase ? await resolveServerUser(supabase) : null;

  let initialAccountOrders: Awaited<ReturnType<typeof resolveGuestOrderListForLocale>> = [];
  let ssrAccountOrdersHydrated = false;
  if (user) {
    const accountList = await listUserOrdersForTenant(tenant);
    if (accountList?.ok) {
      initialAccountOrders = await resolveGuestOrderListForLocale(tenant, accountList.orders, locale);
      ssrAccountOrdersHydrated = true;
    }
  }

  let initialGuestOrders: Awaited<ReturnType<typeof resolveGuestOrderListForLocale>> = [];
  let ssrGuestOrdersHydrated = false;
  const guestSessionId = await readGuestSessionIdFromCookies();
  if (guestSessionId) {
    const guestList = await listGuestOrdersForTenant(tenant, guestSessionId);
    if (guestList.ok) {
      initialGuestOrders = await resolveGuestOrderListForLocale(tenant, guestList.orders, locale);
      ssrGuestOrdersHydrated = true;
    }
  }

  return (
    <div className={chayaConsumerContentClass} aria-label={m.orders.pageTitle}>
      <p className="sr-only">{m.orders.pageTitle}</p>

      <GuestOrdersHub
        tenant={tenant}
        loggedIn={!!user}
        initialAccountOrders={initialAccountOrders}
        initialGuestOrders={initialGuestOrders}
        ssrAccountOrdersHydrated={ssrAccountOrdersHydrated}
        ssrGuestOrdersHydrated={ssrGuestOrdersHydrated}
      />
    </div>
  );
}
