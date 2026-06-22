"use client";

import { Menu } from "lucide-react";

import { ConsumerStoreLogo, hasStoreLogo } from "@/components/consumer-store-logo";
import { MerchantHeaderBell } from "@/components/merchant-header-bell";
import { prefetchMerchantMoreLive } from "@/lib/merchant/merchant-live-prefetch";
import { useMerchantHeaderOverlay } from "@/lib/merchant/merchant-header-overlay-context";

type Props = {
  tenant: string;
  storeName: string;
  logoUrl: string | null;
};

/** 점주 상단 — 뷰포트 전체 너비(고정 헤더) */
export function MerchantHomeHeader({ tenant, storeName, logoUrl }: Props) {
  const overlay = useMerchantHeaderOverlay();
  const showLogo = hasStoreLogo(logoUrl);

  return (
    <header className="merchant-viewport-bar sticky top-0 z-30 mb-3 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="flex items-center gap-2.5 py-2.5">
        {showLogo ? (
          <>
            <ConsumerStoreLogo displayName={storeName} logoUrl={logoUrl} sizeClass="h-9 w-9" shape="rounded" />
            <h1 className="min-w-0 flex-1 truncate text-[17px] font-extrabold leading-tight text-[#111827] dark:text-zinc-50">
              {storeName}
            </h1>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            <ConsumerStoreLogo
              displayName={storeName}
              logoUrl={null}
              shape="rounded"
              fallback="wordmark"
              tone="brand"
              wordmarkSize="lg"
              className="max-w-full"
            />
          </div>
        )}
        <MerchantHeaderBell tenant={tenant} />
        <button
          type="button"
          onClick={() => overlay?.openOverlay("more")}
          onPointerEnter={() => prefetchMerchantMoreLive(tenant)}
          onFocus={() => prefetchMerchantMoreLive(tenant)}
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#F2F3F5] text-zinc-700 active:opacity-75 dark:bg-zinc-900 dark:text-zinc-200"
          aria-label="더보기"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </header>
  );
}
