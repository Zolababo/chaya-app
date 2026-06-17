"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  isMerchantCacheFresh,
  MERCHANT_CACHE_INVALIDATE_EVENT,
  MERCHANT_CACHE_STALE_MS,
  readMerchantCache,
  writeMerchantCache,
  type MerchantCacheScope,
} from "@/lib/merchant/merchant-client-cache";

type ParsedResult<T> = T | { ok: false; message: string };

type Options<T extends { ok: true }> = {
  tenant: string;
  cacheKey: string;
  url: string;
  enabled?: boolean;
  invalidateScope: MerchantCacheScope;
  parse: (json: unknown) => ParsedResult<T> | null;
  /** 캐시가 이 시간(ms) 이내면 백그라운드 재조회 생략 */
  staleTimeMs?: number;
};

type Result<T extends { ok: true }> = {
  data: T | null;
  error: string | null;
  isRefreshing: boolean;
  revalidate: () => void;
};

export function useMerchantLiveFetch<T extends { ok: true }>({
  tenant,
  cacheKey,
  url,
  enabled = true,
  invalidateScope,
  parse,
  staleTimeMs = MERCHANT_CACHE_STALE_MS,
}: Options<T>): Result<T> {
  const cached = readMerchantCache<T>(cacheKey);
  const [data, setData] = useState<T | null>(cached);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(enabled && !cached);
  const mountedRef = useRef(true);

  const load = useCallback(
    async (force = false) => {
      if (!enabled) return;

      const hasCache = readMerchantCache<T>(cacheKey) != null;
      if (!force && hasCache && isMerchantCacheFresh(cacheKey, staleTimeMs)) {
        if (mountedRef.current) setIsRefreshing(false);
        return;
      }

      setIsRefreshing((prev) => prev || !hasCache);
      try {
        const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
        if (!res.ok) {
          if (mountedRef.current && !readMerchantCache<T>(cacheKey)) {
            setError("데이터를 불러오지 못했습니다.");
          }
          return;
        }
        const json = (await res.json()) as unknown;
        const parsed = parse(json);
        if (!parsed) {
          if (mountedRef.current && !readMerchantCache<T>(cacheKey)) {
            setError("데이터 형식이 올바르지 않습니다.");
          }
          return;
        }
        if (parsed.ok === false) {
          if (mountedRef.current) setError(parsed.message);
          return;
        }
        writeMerchantCache(cacheKey, parsed);
        if (mountedRef.current) {
          setData(parsed);
          setError(null);
        }
      } catch {
        if (mountedRef.current && !readMerchantCache<T>(cacheKey)) {
          setError("네트워크 오류가 발생했습니다.");
        }
      } finally {
        if (mountedRef.current) setIsRefreshing(false);
      }
    },
    [cacheKey, enabled, parse, staleTimeMs, url],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load(false);
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled) return;

    const onInvalidate = (ev: Event) => {
      const detail = (ev as CustomEvent<{ tenant?: string; scope?: MerchantCacheScope }>).detail;
      if (!detail?.tenant || detail.tenant.trim() !== tenant.trim()) return;
      if (detail.scope !== invalidateScope && detail.scope !== "all") return;
      void load(true);
    };

    window.addEventListener(MERCHANT_CACHE_INVALIDATE_EVENT, onInvalidate);
    return () => window.removeEventListener(MERCHANT_CACHE_INVALIDATE_EVENT, onInvalidate);
  }, [enabled, invalidateScope, load, tenant]);

  return { data, error, isRefreshing, revalidate: () => void load(true) };
}
