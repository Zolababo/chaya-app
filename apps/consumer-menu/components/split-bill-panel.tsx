"use client";

import { useMemo, useState } from "react";

type Props = {
  total: number;
};

export function SplitBillPanel({ total }: Props) {
  const [people, setPeople] = useState(2);

  const perPerson = useMemo(() => {
    if (people < 1 || total <= 0) return 0;
    return Math.ceil(total / people);
  }, [people, total]);

  if (total <= 0) return null;

  return (
    <section
      className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950"
      aria-labelledby="split-bill-heading"
    >
      <h2 id="split-bill-heading" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        더치페이 (참고)
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        결제는 매장 카운터에서 합니다. 아래 금액은 나눠 낼 때 참고용입니다.
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="split-people" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          인원
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-zinc-200 text-lg font-bold dark:bg-zinc-800"
            aria-label="인원 한 명 줄이기"
            onClick={() => setPeople((n) => Math.max(1, n - 1))}
          >
            −
          </button>
          <input
            id="split-people"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={people}
            onChange={(e) => {
              const v = Math.floor(Number(e.target.value));
              setPeople(Number.isFinite(v) ? Math.max(1, Math.min(20, v)) : 1);
            }}
            className="min-h-[44px] w-16 rounded-lg border border-chaya-border bg-white text-center text-base dark:border-zinc-700 dark:bg-zinc-900"
            aria-describedby="split-per-person"
          />
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-zinc-200 text-lg font-bold dark:bg-zinc-800"
            aria-label="인원 한 명 늘리기"
            onClick={() => setPeople((n) => Math.min(20, n + 1))}
          >
            +
          </button>
        </div>
      </div>
      <p id="split-per-person" className="mt-3 text-right text-base font-bold tabular-nums text-chaya-primary dark:text-orange-400">
        1인당 약 {perPerson.toLocaleString("ko-KR")}원
      </p>
    </section>
  );
}
