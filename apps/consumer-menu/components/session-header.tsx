"use client";

import { useSearchParams } from "next/navigation";

type Props = {
  tenant: string;
};

export function SessionHeader({ tenant }: Props) {
  const searchParams = useSearchParams();
  const table = searchParams.get("table") ?? "—";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full max-w-full items-center justify-between border-b border-chaya-border bg-chaya-surface px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tracking-tight text-chaya-primary dark:text-orange-400">
          Table {table}
        </span>
        <span className="sr-only">가게 코드 {tenant}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-xl border border-chaya-border px-4 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          disabled
        >
          Call Staff
        </button>
      </div>
    </header>
  );
}
