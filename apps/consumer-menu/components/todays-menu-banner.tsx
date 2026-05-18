"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { pickTodaysMenuItems } from "@/lib/menus/pick-todays-menu";
import { resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
};

/** KFC형 프로모 슬라이드 느낌 — 높이는 낮게(메뉴 리스트 가리지 않음). */
export function TodaysMenuBanner({ tenant, items }: Props) {
  const { locale, m } = useConsumerLocale();
  const picks = useMemo(() => pickTodaysMenuItems(items, 3), [items]);
  const [index, setIndex] = useState(0);

  if (picks.length === 0) return null;

  const safeIndex = index % picks.length;
  const raw = picks[safeIndex];
  const item = resolveMenuRowForLocale(raw, locale);
  const href = withConsumerLang(`/t/${tenant}/menu/${encodeURIComponent(item.id)}`, locale);

  return (
    <section
      className="relative -mx-4 mb-2 sm:-mx-6"
      aria-label={m.menu.todaysMenuLabel}
    >
      <Link
        href={href}
        className="relative mx-4 flex h-[5.25rem] overflow-hidden rounded-xl border border-zinc-200/90 bg-gradient-to-r from-orange-50 to-white shadow-sm ring-1 ring-black/[0.04] active:scale-[0.995] sm:mx-6 dark:border-zinc-800 dark:from-orange-950/30 dark:to-zinc-950 dark:ring-white/5"
      >
        {item.imageUrl?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-[5.25rem] shrink-0 object-cover"
          />
        ) : (
          <div
            className="flex h-full w-[5.25rem] shrink-0 items-center justify-center bg-chaya-primary/15 text-2xl font-bold text-chaya-primary dark:bg-orange-950/50 dark:text-orange-300"
            aria-hidden
          >
            {item.name.charAt(0)}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-chaya-primary dark:text-orange-400">
            {m.menu.todaysMenuLabel}
          </p>
          <p className="truncate text-sm font-bold leading-tight text-zinc-900 dark:text-zinc-50">
            {item.name}
          </p>
          <p className="text-xs font-semibold tabular-nums text-zinc-600 dark:text-zinc-400">
            {formatConsumerMoney(item.price, locale)}
          </p>
        </div>
        {picks.length > 1 ? (
          <span className="absolute bottom-1.5 right-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
            {safeIndex + 1}/{picks.length}
          </span>
        ) : null}
      </Link>
      {picks.length > 1 ? (
        <div className="mt-1.5 flex justify-center gap-1" aria-hidden>
          {picks.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={[
                "h-1.5 rounded-full transition-all",
                i === safeIndex ? "w-4 bg-chaya-primary" : "w-1.5 bg-zinc-300 dark:bg-zinc-600",
              ].join(" ")}
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
