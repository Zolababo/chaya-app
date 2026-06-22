"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { MerchantAnnouncementsPageClient } from "@/components/merchant-announcements-page-client";
import { MerchantMoreHubOverlayClient } from "@/components/merchant-more-hub-overlay-client";
import {
  useMerchantHeaderOverlay,
  type MerchantHeaderOverlay,
} from "@/lib/merchant/merchant-header-overlay-context";

type Props = {
  tenant: string;
};

function overlayTitle(mode: MerchantHeaderOverlay): string {
  if (mode === "announcements") return "공지사항";
  if (mode === "more") return "더보기";
  return "";
}

export function MerchantHeaderOverlayHost({ tenant }: Props) {
  const ctx = useMerchantHeaderOverlay();
  const pathname = usePathname() ?? "";
  const open = ctx?.overlay ?? null;
  const openRef = useRef(open);
  openRef.current = open;
  const closeOverlayRef = useRef(ctx?.closeOverlay);
  closeOverlayRef.current = ctx?.closeOverlay;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!openRef.current) return;
    closeOverlayRef.current?.();
  }, [pathname]);

  if (!open || !ctx) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-[#F2F3F5] dark:bg-zinc-950"
      role="dialog"
      aria-modal="true"
      aria-label={overlayTitle(open)}
    >
      <header className="merchant-viewport-bar sticky top-0 z-10 flex min-h-[52px] items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex min-w-0 items-center gap-2">
          {open === "more" ? (
            <Menu className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
          ) : null}
          <h2 className="truncate text-[17px] font-extrabold text-[#111827] dark:text-zinc-50">
            {overlayTitle(open)}
          </h2>
        </div>
        <button
          type="button"
          onClick={ctx.closeOverlay}
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#F2F3F5] text-zinc-700 active:opacity-75 dark:bg-zinc-900 dark:text-zinc-200"
          aria-label="닫기"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {open === "announcements" ? (
          <MerchantAnnouncementsPageClient tenant={tenant} embedded onClose={ctx.closeOverlay} />
        ) : null}
        {open === "more" ? (
          <MerchantMoreHubOverlayClient tenant={tenant} onNavigate={ctx.closeOverlay} />
        ) : null}
      </div>
    </div>
  );
}
