/** DB CHECK `orders_status_allowed` 와 동일하게 유지하세요. */
export const MERCHANT_ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type MerchantOrderStatus = (typeof MERCHANT_ORDER_STATUSES)[number];

export function isMerchantOrderStatus(v: string): v is MerchantOrderStatus {
  return (MERCHANT_ORDER_STATUSES as readonly string[]).includes(v);
}
