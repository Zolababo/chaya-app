"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ConsumerStoreLogo } from "@/components/consumer-store-logo";
import {
  CONSUMER_STAFF_CALL_IMPLEMENTED,
  CONSUMER_STAFF_CALL_UI_VISIBLE,
} from "@/lib/consumer/future-features";
import { readTablePref } from "@/lib/cart/table-pref";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useEasyMenuHref } from "@/lib/consumer/use-easy-menu-href";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

type Props = {
  tenant: string;
  displayName: string;
  logoUrl?: string | null;
  toolbarSlot?: ReactNode;
};

export function SessionHeader({ tenant, displayName, logoUrl, toolbarSlot }: Props) {
  const { m } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();
  const homeHref = useEasyMenuHref(tenant);
  const searchParams = useSearchParams();
  const queryTable = searchParams.get("table")?.trim() ?? "";
  const [storedTable, setStoredTable] = useState("");

  useEffect(() => {
    setStoredTable(readTablePref(tenant));
  }, [tenant, queryTable]);

  const table = queryTable || storedTable;
  const tableLine = table
    ? m.header.tableBadge.replace("{table}", table)
    : null;

  const showStaffCall = CONSUMER_STAFF_CALL_UI_VISIBLE && CONSUMER_STAFF_CALL_IMPLEMENTED;

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-chaya-border/80 bg-chaya-surface/95 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className={`flex items-center justify-between gap-2.5 px-4 py-2 sm:gap-3 sm:px-6 ${easyMode ? "min-h-[4.75rem]" : "min-h-[4.25rem]"}`}>
        <Link
          href={homeHref}
          className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl outline-none ring-chaya-primary ring-offset-2 ring-offset-background focus-visible:ring-2 dark:ring-offset-zinc-950"
        >
          <ConsumerStoreLogo displayName={displayName} logoUrl={logoUrl} />
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 ${easyMode ? "text-xl" : "text-lg"}`}
            >
              {displayName}
            </p>
            {tableLine ? (
              <p
                className={`mt-0.5 truncate font-semibold text-chaya-primary dark:text-orange-400 ${easyMode ? "text-sm" : "text-xs"}`}
              >
                {tableLine}
              </p>
            ) : (
              <p className={`mt-0.5 truncate text-zinc-500 dark:text-zinc-400 ${easyMode ? "text-sm" : "text-xs"}`}>
                {m.header.orderMenu}
              </p>
            )}
          </div>
        </Link>
        {toolbarSlot ? <div className="flex shrink-0 items-center">{toolbarSlot}</div> : null}
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
