"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { cartQtyMinusClass, cartQtyPlusClass, chayaSurfaceCardPaddedClass } from "@/components/menu-list-styles";
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
      className={chayaSurfaceCardPaddedClass}
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
            className={`${cartQtyMinusClass} size-8`}
            aria-label={m.splitBill.decreasePeople}
            onClick={() => setPeople((n) => Math.max(1, n - 1))}
          >
            <Minus className="size-3.5" aria-hidden />
          </button>
          <span className="min-w-8 text-center text-base font-semibold tabular-nums" aria-live="polite">
            {people}
          </span>
          <button
            type="button"
            className={`${cartQtyPlusClass} size-8`}
            aria-label={m.splitBill.increasePeople}
            onClick={() => setPeople((n) => Math.min(20, n + 1))}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <p className="mt-3 text-right text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {perPersonLabel}
      </p>
    </section>
  );
}
