"use server";

import { listGuestOrdersForTenant, type GuestOrdersListResult } from "@/lib/orders/list-guest-orders";
import { listUserOrdersForTenant, type UserOrdersListResult } from "@/lib/orders/list-user-orders";

export async function listGuestOrdersAction(
  tenant: string,
  guestSessionId: string,
): Promise<GuestOrdersListResult> {
  return listGuestOrdersForTenant(tenant, guestSessionId);
}

export async function listUserOrdersAction(tenant: string): Promise<UserOrdersListResult> {
  return listUserOrdersForTenant(tenant);
}
