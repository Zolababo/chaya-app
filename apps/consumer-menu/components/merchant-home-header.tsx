"use client";

import { Menu } from "lucide-react";

import { ConsumerStoreLogo } from "@/components/consumer-store-logo";
import { MerchantHeaderBell } from "@/components/merchant-header-bell";
import { prefetchMerchantMoreLive } from "@/lib/merchant/merchant-live-prefetch";
import { useMerchantHeaderOverlay } from "@/lib/merchant/merchant-header-overlay-context";

type Props = {
  tenant: string;
  storeName: string;
  logoUrl: string | null;
};

/** 점주 상단 — 손님앱 SessionHeader 와 동일한 업소명·로고 표시 */
export function MerchantHomeHeader({ tenant, storeName, logoUrl }: Props) {
  const overlay = useMerchantHeaderOverlay();

  return (
    <header className="merchant-viewport-bar sticky top-0 z-30 mb-3 border-b border-chaya-border/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="flex items-center gap-2 py-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <ConsumerStoreLogo
            displayName={storeName}
            logoUrl={logoUrl}
            sizeClass="h-10 w-10"
            shape="circle"
            fallback="initial"
          />
          <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[1.35rem]">
            {storeName}
          </h1>
        </div>
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
