"use client";

import { useSearchParams } from "next/navigation";

type Props = {
  tenant: string;
};

export function SessionHeader({ tenant }: Props) {
  const searchParams = useSearchParams();
  const table = searchParams.get("table") ?? "—";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full max-w-full items-center justify-between border-b-2 border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tracking-tight text-orange-700 dark:text-orange-500">
          Table {table}
        </span>
        <span className="sr-only">가게 코드 {tenant}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-xl border-2 border-zinc-200 px-4 py-2 text-sm font-semibold dark:border-zinc-700"
          disabled
        >
          Call Staff
        </button>
      </div>
    </header>
  );
}
