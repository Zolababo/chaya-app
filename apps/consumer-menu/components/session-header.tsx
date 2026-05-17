"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  CONSUMER_STAFF_CALL_IMPLEMENTED,
  CONSUMER_STAFF_CALL_UI_VISIBLE,
} from "@/lib/consumer/future-features";
import { readTablePref } from "@/lib/cart/table-pref";

type Props = {
  tenant: string;
  accountSlot?: ReactNode;
  localeSlot?: ReactNode;
};

export function SessionHeader({ tenant, accountSlot, localeSlot }: Props) {
  const searchParams = useSearchParams();
  const queryTable = searchParams.get("table")?.trim() ?? "";
  const [storedTable, setStoredTable] = useState("");

  useEffect(() => {
    setStoredTable(readTablePref(tenant));
  }, [tenant, queryTable]);

  const table = queryTable || storedTable;
  const tableLabel =
    table === ""
      ? "테이블 번호 없음"
      : `테이블 ${table}`;

  const showStaffCall = CONSUMER_STAFF_CALL_UI_VISIBLE && CONSUMER_STAFF_CALL_IMPLEMENTED;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full max-w-full items-center justify-between border-b border-chaya-border bg-chaya-surface px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
      <div className="flex min-w-0 flex-col">
        <span
          className="truncate text-lg font-bold tracking-tight text-chaya-primary dark:text-orange-400"
          aria-label={tableLabel}
        >
          {table ? `테이블 ${table}` : "주문 메뉴"}
        </span>
        <span className="sr-only">가게 {tenant}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {localeSlot}
        {accountSlot}
        {showStaffCall ? (
          <button
            type="button"
            className="min-h-[44px] rounded-xl border border-chaya-border bg-chaya-surface px-4 py-2 text-sm font-semibold text-chaya-primary dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="직원 호출"
          >
            직원 호출
          </button>
        ) : null}
      </div>
    </header>
  );
}
