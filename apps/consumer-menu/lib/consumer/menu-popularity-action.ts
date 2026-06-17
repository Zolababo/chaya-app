"use server";

import {
  getMenuPopularityForTenant,
  type MenuPopularityResult,
} from "@/lib/orders/menu-popularity";

export async function fetchMenuPopularityAction(
  tenant: string,
): Promise<MenuPopularityResult> {
  return getMenuPopularityForTenant(tenant);
}
