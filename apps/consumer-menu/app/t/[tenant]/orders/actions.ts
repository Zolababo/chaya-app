"use server";

import { listGuestOrdersForTenant, type GuestOrdersListResult } from "@/lib/orders/list-guest-orders";

export async function listGuestOrdersAction(
  tenant: string,
  guestSessionId: string,
): Promise<GuestOrdersListResult> {
  return listGuestOrdersForTenant(tenant, guestSessionId);
}
