"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ConsumerStoreLogo, ConsumerTableBadge } from "@/components/consumer-store-logo";
import {
  CONSUMER_STAFF_CALL_IMPLEMENTED,
  CONSUMER_STAFF_CALL_UI_VISIBLE,
} from "@/lib/consumer/future-features";
import { useTenantTableSelection } from "@/lib/cart/use-tenant-table-selection";
import { useScreenReaderMenuHref } from "@/lib/consumer/use-screen-reader-menu-href";
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
  const homeHref = useScreenReaderMenuHref(tenant);
  const { effectiveCode, needsPick, hasRegistry } = useTenantTableSelection(tenant);
  const tableLine = effectiveCode
    ? m.header.tableBadge.replace("{table}", effectiveCode)
    : hasRegistry && needsPick
      ? m.cart.tablePickRequired
      : null;

  const showStaffCall = CONSUMER_STAFF_CALL_UI_VISIBLE && CONSUMER_STAFF_CALL_IMPLEMENTED;

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-chaya-border/60 bg-chaya-bg/95 backdrop-blur supports-[backdrop-filter]:bg-chaya-bg/80 dark:border-zinc-800 dark:bg-zinc-950/95">
      <div
        className={`${chayaConsumerShellClass} flex items-center justify-between gap-2 py-2 sm:gap-3`}
      >
        <Link
          href={homeHref}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl outline-none ring-chaya-primary ring-offset-2 ring-offset-chaya-bg focus-visible:ring-2 dark:ring-offset-zinc-950 sm:gap-3"
        >
          <ConsumerStoreLogo
            displayName={displayName}
            logoUrl={logoUrl}
            sizeClass="h-10 w-10"
            shape="circle"
            fallback="initial"
          />
          <span className="min-w-0 flex-1 truncate text-xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[1.35rem]">
            {displayName}
          </span>
          {effectiveCode ? (
            <ConsumerTableBadge
              label={tableLine ?? ""}
              tableCode={effectiveCode}
              variant="inline"
            />
          ) : tableLine ? (
            <ConsumerTableBadge label={tableLine} variant="default" className="max-w-[40%] shrink" />
          ) : null}
        </Link>
        {toolbarSlot ? <div className="flex shrink-0 items-center gap-1.5">{toolbarSlot}</div> : null}
      </div>
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
