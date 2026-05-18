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
    <nav
      aria-label="언어 선택"
      className="flex max-w-[min(100vw,14rem)] gap-1 overflow-x-auto rounded-xl bg-zinc-100/80 p-0.5 dark:bg-zinc-900/80 sm:max-w-[min(100vw,18rem)]"
    >
      {APP_LOCALES.map((code) => {
        const selected = active === code;
        const meta = LOCALE_META[code];
        return (
          <a
            key={code}
            href={buildHref(pathname, searchParams, code)}
            className={
              selected
                ? "inline-flex min-h-[40px] shrink-0 items-center rounded-lg bg-chaya-primary px-2.5 py-1 text-[11px] font-bold text-chaya-on-primary shadow-sm"
                : "inline-flex min-h-[40px] shrink-0 items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-white/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
