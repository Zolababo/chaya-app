"use server";

import type { AppLocale } from "@/lib/i18n/locales";
import { listGuestOrdersForTenant, type GuestOrdersListResult } from "@/lib/orders/list-guest-orders";
import { resolveGuestOrderListForLocale } from "@/lib/orders/resolve-order-lines-for-locale";
import { listUserOrdersForTenant, type UserOrdersListResult } from "@/lib/orders/list-user-orders";

export async function listGuestOrdersAction(
  tenant: string,
  guestSessionId: string,
  locale: AppLocale,
): Promise<GuestOrdersListResult> {
  const res = await listGuestOrdersForTenant(tenant, guestSessionId);
  if (!res.ok) return res;
  const orders = await resolveGuestOrderListForLocale(tenant, res.orders, locale);
  return { ok: true, orders };
}

export async function listUserOrdersAction(
  tenant: string,
  locale: AppLocale,
): Promise<UserOrdersListResult> {
  const res = await listUserOrdersForTenant(tenant);
  if (!res.ok) return res;
  const orders = await resolveGuestOrderListForLocale(tenant, res.orders, locale);
  return { ok: true, orders };
}
