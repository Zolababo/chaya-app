"use client";

import { MerchantMoreHubContent } from "@/components/merchant-more-hub-content";
import { MerchantLoadingCenter } from "@/components/merchant-loading-center";
import { merchantCacheKey } from "@/lib/merchant/merchant-client-cache";
import { parseMerchantLiveMore } from "@/lib/merchant/merchant-live-types";
import { useMerchantLiveFetch } from "@/lib/merchant/use-merchant-live-fetch";

type Props = {
  tenant: string;
  onNavigate?: () => void;
};

/** 더보기 허브 — `/live/more` (풀 SSR 라우트 대체) */
export function MerchantMoreHubOverlayClient({ tenant, onNavigate }: Props) {
  const tEnc = encodeURIComponent(tenant);
  const cacheKey = merchantCacheKey(tenant, "more");
  const url = `/m/${tEnc}/live/more`;

  const { data, error, isRefreshing } = useMerchantLiveFetch({
    tenant,
    cacheKey,
    url,
    invalidateScope: "more",
    parse: parseMerchantLiveMore,
    staleTimeMs: 120_000,
  });

  const loadError =
    error ?? (data == null && !isRefreshing ? "더보기 메뉴를 불러오지 못했습니다." : null);

  if (loadError) {
    return (
      <p
        role="alert"
        className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
      >
        {loadError}
      </p>
    );
  }

  if (!data?.snapshot) return <MerchantLoadingCenter className="py-16" />;

  return (
    <div className="px-4 pb-24 pt-2" aria-label="더보기 메뉴">
      <MerchantMoreHubContent {...data.snapshot} onNavigate={onNavigate} />
    </div>
  );
}
