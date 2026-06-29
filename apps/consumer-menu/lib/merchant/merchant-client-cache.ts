"use client";

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

/** 탭 왕복 시 불필요한 재조회 방지 (ms) */
export const MERCHANT_CACHE_STALE_MS = 45_000;

export function merchantCacheKey(tenant: string, resource: string, suffix?: string): string {
  const t = tenant.trim();
  return suffix ? `${t}:${resource}:${suffix}` : `${t}:${resource}`;
}

export function readMerchantCache<T>(key: string): T | null {
  const hit = store.get(key);
  return hit ? (hit.data as T) : null;
}

export function getMerchantCacheAgeMs(key: string): number | null {
  const hit = store.get(key);
  return hit ? Date.now() - hit.fetchedAt : null;
}

export function isMerchantCacheFresh(key: string, maxAgeMs = MERCHANT_CACHE_STALE_MS): boolean {
  const age = getMerchantCacheAgeMs(key);
  return age != null && age < maxAgeMs;
}

export function writeMerchantCache<T>(key: string, data: T): void {
  store.set(key, { data, fetchedAt: Date.now() });
}

export function patchMerchantCache<T>(key: string, patch: (prev: T) => T): void {
  const hit = store.get(key);
  if (!hit) return;
  store.set(key, { data: patch(hit.data as T), fetchedAt: Date.now() });
}

export function invalidateMerchantCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export type MerchantCacheScope = "menus" | "orders" | "dashboard" | "analytics" | "more" | "all";

export const MERCHANT_CACHE_INVALIDATE_EVENT = "chaya-merchant-cache-invalidate";

export function dispatchMerchantCacheInvalidate(tenant: string, scope: MerchantCacheScope): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MERCHANT_CACHE_INVALIDATE_EVENT, { detail: { tenant, scope } }),
  );
}

export function invalidateMerchantSalesCaches(tenant: string): void {
  invalidateMerchantCacheForTenant(tenant, "dashboard");
  invalidateMerchantCacheForTenant(tenant, "analytics");
}

export function invalidateMerchantCacheForTenant(tenant: string, scope: MerchantCacheScope): void {
  const t = tenant.trim();
  if (scope === "all" || scope === "menus") {
    invalidateMerchantCache(merchantCacheKey(t, "menus"));
  }
  if (scope === "all" || scope === "orders") {
    invalidateMerchantCache(merchantCacheKey(t, "orders"));
  }
  if (scope === "all" || scope === "analytics") {
    invalidateMerchantCache(merchantCacheKey(t, "analytics"));
  }
  if (scope === "all" || scope === "more" || scope === "dashboard") {
    invalidateMerchantCache(merchantCacheKey(t, "more"));
  }
  if (scope === "all" || scope === "menus" || scope === "orders" || scope === "dashboard") {
    invalidateMerchantCache(merchantCacheKey(t, "dashboard"));
  }
  dispatchMerchantCacheInvalidate(t, scope);
  if (scope === "menus" || scope === "orders") {
    dispatchMerchantCacheInvalidate(t, "dashboard");
  }
}
