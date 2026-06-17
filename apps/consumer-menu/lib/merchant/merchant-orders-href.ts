import {
  merchantOrdersTabHref,
  type MerchantOrdersTab,
} from "@/lib/merchant/merchant-orders-tab";
import type { MerchantOrderStatus } from "@/lib/orders/merchant-status-constants";

/** @deprecated `merchantOrdersTabHref` 사용. 구 옵션 → `tab` 매핑. */
export function merchantOrdersHref(
  tenant: string,
  opts?: {
    status?: MerchantOrderStatus | null;
    bucket?: "in_progress" | "cooking" | null;
    today?: boolean;
  },
): string {
  let tab: MerchantOrdersTab = "cooking";
  if (opts?.bucket === "in_progress" || opts?.bucket === "cooking") tab = "cooking";
  else if (opts?.status === "pending") tab = "pending";
  else if (opts?.status === "ready") tab = "ready";
  else if (opts?.status === "completed") tab = "paid";
  else if (opts?.status === "cancelled") tab = "cancelled";
  return merchantOrdersTabHref(tenant, tab);
}
