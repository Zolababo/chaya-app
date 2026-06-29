"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ConsumerStoreLogo } from "@/components/consumer-store-logo";
import {
  CONSUMER_STAFF_CALL_IMPLEMENTED,
  CONSUMER_STAFF_CALL_UI_VISIBLE,
} from "@/lib/consumer/future-features";
import { useTenantTableSelection } from "@/lib/cart/use-tenant-table-selection";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useEasyMenuHref } from "@/lib/consumer/use-easy-menu-href";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { chayaConsumerShellClass } from "@/lib/responsive/chaya-app-shell";

type Props = {
  tenant: string;
  displayName: string;
  logoUrl?: string | null;
  toolbarSlot?: ReactNode;
};

export function SessionHeader({ tenant, displayName, logoUrl, toolbarSlot }: Props) {
  const { m } = useConsumerLocale();
  const { fontScale, voiceEnabled } = useConsumerEasyMode();
  const homeHref = useEasyMenuHref(tenant);
  const { effectiveCode, needsPick, hasRegistry } = useTenantTableSelection(tenant);
  const largeHeader = fontScale !== "normal";

  const tableBadgeLabel = effectiveCode
    ? m.header.tableBadge.replace("{table}", effectiveCode)
    : null;

  const showStaffCall = CONSUMER_STAFF_CALL_UI_VISIBLE && CONSUMER_STAFF_CALL_IMPLEMENTED;

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-chaya-border/60 bg-chaya-bg/95 backdrop-blur supports-[backdrop-filter]:bg-chaya-bg/80 dark:border-zinc-800 dark:bg-zinc-950/95">
      <div
        className={`${chayaConsumerShellClass} flex items-center gap-2 py-2 sm:gap-3 ${largeHeader ? "min-h-[4.25rem]" : ""}`}
      >
        <Link
          href={homeHref}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl outline-none ring-chaya-primary ring-offset-2 ring-offset-chaya-bg focus-visible:ring-2 dark:ring-offset-zinc-950 sm:gap-3"
        >
          <ConsumerStoreLogo
            displayName={displayName}
            logoUrl={logoUrl}
            sizeClass={largeHeader ? "h-11 w-11" : "h-10 w-10"}
            shape="circle"
            fallback="initial"
          />
          <div className="min-w-0 flex-1">
            <h1
              className={`truncate font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 ${largeHeader ? "text-xl sm:text-2xl" : "text-xl sm:text-[1.35rem]"}`}
            >
              {displayName}
            </h1>
            {tableBadgeLabel ? (
              <p
                className="mt-0.5 truncate text-sm font-bold text-chaya-primary dark:text-orange-400"
                aria-live="polite"
              >
                {tableBadgeLabel}
              </p>
            ) : hasRegistry && needsPick ? (
              <p className="mt-0.5 truncate text-sm font-semibold text-amber-700 dark:text-amber-300">
                {m.cart.tablePickRequired}
              </p>
            ) : null}
          </div>
        </Link>
        {toolbarSlot ? <div className="flex shrink-0 items-center gap-0.5">{toolbarSlot}</div> : null}
      </div>
      {voiceEnabled ? (
        <div
          className="border-t border-chaya-primary/15 bg-chaya-primary/8 px-4 py-1.5 text-center"
          role="status"
          aria-live="polite"
        >
          <span className="text-[11px] font-bold text-chaya-primary">🔊 {m.settings.voiceBadge}</span>
        </div>
      ) : null}
      {showStaffCall ? (
        <div className="border-t border-chaya-border px-4 py-2 dark:border-zinc-800">
          <button
            type="button"
            className="min-h-[44px] w-full rounded-xl border border-chaya-border bg-chaya-surface px-4 py-2 text-sm font-semibold text-chaya-primary dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="직원 호출"
          >
            직원 호출
          </button>
        </div>
      ) : null}
    </header>
  );
}
