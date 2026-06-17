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

/** @deprecated `MERCHANT_COOKING_STATUSES` + `ready` 로 분리. 구 링크 호환용. */
export const MERCHANT_IN_PROGRESS_STATUSES = ["accepted", "preparing", "ready"] as const;

/** 홈 「조리중」·`?bucket=cooking` — 접수·조리. */
export const MERCHANT_COOKING_STATUSES = ["accepted", "preparing"] as const;

export type MerchantOrderListBucket = "in_progress" | "cooking" | "all_active";

export function isMerchantOrderListBucket(v: string): v is MerchantOrderListBucket {
  return v === "in_progress" || v === "cooking" || v === "all_active";
}
