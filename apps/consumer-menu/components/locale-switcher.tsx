"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { APP_LOCALES, LOCALE_META, type AppLocale } from "@/lib/i18n/locales";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

function buildHref(pathname: string, searchParams: URLSearchParams, locale: AppLocale): string {
  const q = new URLSearchParams(searchParams.toString());
  if (locale === "ko") {
    q.delete("lang");
  } else {
    q.set("lang", locale);
  }
  const qs = q.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function LocaleSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale: active } = useConsumerLocale();

  return (
    <nav aria-label="언어 선택" className="flex max-w-[min(100vw,20rem)] gap-1 overflow-x-auto pb-0.5">
      {APP_LOCALES.map((code) => {
        const selected = active === code;
        const meta = LOCALE_META[code];
        return (
          <a
            key={code}
            href={buildHref(pathname, searchParams, code)}
            className={
              selected
                ? "inline-flex min-h-[36px] shrink-0 items-center rounded-lg bg-chaya-primary px-2 py-1 text-[11px] font-bold text-chaya-on-primary"
                : "inline-flex min-h-[36px] shrink-0 items-center rounded-lg border border-chaya-border bg-chaya-surface px-2 py-1 text-[11px] font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            }
            aria-current={selected ? "true" : undefined}
            lang={code}
          >
            {meta.shortLabel}
          </a>
        );
      })}
    </nav>
  );
}
