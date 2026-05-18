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
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

type Props = {
  tenant: string;
  displayName: string;
  logoUrl?: string | null;
  toolbarSlot?: ReactNode;
};

export function SessionHeader({ tenant, displayName, logoUrl, toolbarSlot }: Props) {
  const { locale, m } = useConsumerLocale();
  const searchParams = useSearchParams();
  const queryTable = searchParams.get("table")?.trim() ?? "";
  const [storedTable, setStoredTable] = useState("");

  useEffect(() => {
    setStoredTable(readTablePref(tenant));
  }, [tenant, queryTable]);

  const table = queryTable || storedTable;
  const homeHref = withConsumerLang(`/t/${encodeURIComponent(tenant)}`, locale);
  const tableLine = table
    ? m.header.tableBadge.replace("{table}", table)
    : null;

  const showStaffCall = CONSUMER_STAFF_CALL_UI_VISIBLE && CONSUMER_STAFF_CALL_IMPLEMENTED;

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-chaya-border/80 bg-chaya-surface/95 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="flex min-h-[3.75rem] items-center justify-between gap-2 px-4 py-1.5 sm:gap-2.5 sm:px-6">
        <Link
          href={homeHref}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none ring-chaya-primary ring-offset-2 ring-offset-background focus-visible:ring-2 dark:ring-offset-zinc-950"
        >
          <ConsumerStoreLogo displayName={displayName} logoUrl={logoUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.9375rem] font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
              {displayName}
            </p>
            {tableLine ? (
              <p className="mt-0.5 truncate text-xs font-semibold text-chaya-primary dark:text-orange-400">
                {tableLine}
              </p>
            ) : (
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{m.header.orderMenu}</p>
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
