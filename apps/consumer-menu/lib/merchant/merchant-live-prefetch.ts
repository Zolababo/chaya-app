"use client";

import {
  isMerchantCacheFresh,
  merchantCacheKey,
  writeMerchantCache,
} from "@/lib/merchant/merchant-client-cache";
import { parseMerchantLiveMore, parseMerchantLiveOrders } from "@/lib/merchant/merchant-live-types";

const inFlight = new Set<string>();
let ordersQueuePanePrefetched = false;

/** 주문 목록·카드 lazy chunk 선로드 */
export function prefetchMerchantOrdersQueuePane(): void {
  if (typeof window === "undefined" || ordersQueuePanePrefetched) return;
  ordersQueuePanePrefetched = true;
  void import("@/components/merchant-orders-queue-pane");
}

/** 홈·헤더 hover 시 주문 live JSON 선조회 */
export function prefetchMerchantOrdersLive(tenant: string, tab = "all"): void {
  if (typeof window === "undefined") return;

  const cacheKey = merchantCacheKey(tenant, "orders", tab);
  if (isMerchantCacheFresh(cacheKey)) return;
  if (inFlight.has(cacheKey)) return;
  inFlight.add(cacheKey);

  const url = `/m/${encodeURIComponent(tenant)}/live/orders?tab=${encodeURIComponent(tab)}`;
  void fetch(url, { credentials: "same-origin", cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return;
      const json: unknown = await res.json();
      const parsed = parseMerchantLiveOrders(json);
      if (parsed?.ok) writeMerchantCache(cacheKey, parsed);
    })
    .catch(() => {})
    .finally(() => inFlight.delete(cacheKey));
}

/** 더보기 오버레이 — `/live/more` 선조회 */
export function prefetchMerchantMoreLive(tenant: string): void {
  if (typeof window === "undefined") return;

  const cacheKey = merchantCacheKey(tenant, "more");
  if (isMerchantCacheFresh(cacheKey)) return;
  if (inFlight.has(cacheKey)) return;
  inFlight.add(cacheKey);

  const url = `/m/${encodeURIComponent(tenant)}/live/more`;
  void fetch(url, { credentials: "same-origin", cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return;
      const json: unknown = await res.json();
      const parsed = parseMerchantLiveMore(json);
      if (parsed?.ok) writeMerchantCache(cacheKey, parsed);
    })
    .catch(() => {})
    .finally(() => inFlight.delete(cacheKey));
}

/** 홈 데이터 로드 직후 — idle 대기 없이 주문 prefetch */
export function scheduleMerchantHomePrefetches(tenant: string): void {
  prefetchMerchantOrdersQueuePane();
  prefetchMerchantOrdersLive(tenant, "all");
  prefetchMerchantMoreLive(tenant);
}

/** @deprecated prefetchMerchantOrdersModule — queue pane prefetch 사용 */
export function prefetchMerchantOrdersModule(): void {
  prefetchMerchantOrdersQueuePane();
}
