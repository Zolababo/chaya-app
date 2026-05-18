"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";

type Props = {
  total: number;
};

export function SplitBillPanel({ total }: Props) {
  const { locale, m } = useConsumerLocale();
  const [people, setPeople] = useState(2);

  const perPerson = useMemo(() => {
    if (people < 1 || total <= 0) return 0;
    return Math.ceil(total / people);
  }, [people, total]);

  if (total <= 0) return null;

  const perPersonLabel = m.splitBill.perPerson.replace(
    "{amount}",
    formatConsumerMoney(perPerson, locale),
  );

  return (
    <section
      className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/50"
      aria-labelledby="split-bill-heading"
    >
      <h2 id="split-bill-heading" className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        {m.splitBill.title}
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{m.splitBill.hint}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{m.splitBill.peopleLabel}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label={m.splitBill.decreasePeople}
            onClick={() => setPeople((n) => Math.max(1, n - 1))}
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="min-w-8 text-center text-base font-semibold tabular-nums" aria-live="polite">
            {people}
          </span>
          <button
            type="button"
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label={m.splitBill.increasePeople}
            onClick={() => setPeople((n) => Math.min(20, n + 1))}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <p className="mt-3 text-right text-lg font-bold tabular-nums text-chaya-primary dark:text-orange-400">
        {perPersonLabel}
      </p>
    </section>
  );
}
