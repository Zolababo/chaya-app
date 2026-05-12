"use client";

import { useSearchParams } from "next/navigation";

import { CONSUMER_STAFF_CALL_IMPLEMENTED } from "@/lib/consumer/future-features";

type Props = {
  tenant: string;
};

export function SessionHeader({ tenant }: Props) {
  const searchParams = useSearchParams();
  const table = searchParams.get("table") ?? "—";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full max-w-full items-center justify-between border-b border-chaya-border bg-chaya-surface px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
      <div className="flex items-center gap-3">
        <span
          className="text-lg font-bold tracking-tight text-chaya-primary dark:text-orange-400"
          aria-label={
            table === "—"
              ? "테이블 번호가 URL에 없습니다"
              : `테이블 번호 ${table}`
          }
        >
          Table {table}
        </span>
        <span className="sr-only">가게 코드 {tenant}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="min-h-[44px] rounded-xl border border-chaya-border px-4 py-2 text-sm font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-500"
          disabled={!CONSUMER_STAFF_CALL_IMPLEMENTED}
          aria-disabled={!CONSUMER_STAFF_CALL_IMPLEMENTED}
          aria-label={
            CONSUMER_STAFF_CALL_IMPLEMENTED
              ? "직원 호출"
              : "직원 호출은 준비 중입니다. 서버 라우트 POST /t/…/staff-call 연동 후 활성화됩니다."
          }
          title="향후: POST /t/{tenant}/staff-call (CONSUMER_STAFF_CALL_IMPLEMENTED)"
        >
          Call Staff
        </button>
      </div>
    </header>
  );
}
