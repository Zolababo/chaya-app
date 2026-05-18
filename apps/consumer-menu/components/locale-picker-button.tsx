"use client";

import { Languages } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { buildConsumerLocaleHref } from "@/lib/i18n/locale-href";
import { setConsumerLocaleCookieClient } from "@/lib/i18n/set-consumer-locale-cookie";
import { APP_LOCALES, LOCALE_META, type AppLocale } from "@/lib/i18n/locales";

const btnClass =
  "inline-flex min-h-[40px] max-w-[6.5rem] items-center justify-center gap-1 rounded-lg border border-chaya-border bg-white px-2 py-1 text-[11px] font-semibold text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function LocalePickerButton() {
  const { locale: active, m } = useConsumerLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const activeMeta = LOCALE_META[active];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={btnClass}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={titleId}
        onClick={() => setOpen(true)}
      >
        <Languages className="size-3.5 shrink-0 text-chaya-primary dark:text-orange-400" aria-hidden />
        <span className="truncate">{activeMeta.shortLabel}</span>
        <span className="sr-only"> — {m.header.languageOpen}</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed bottom-0 left-0 right-0 z-[60] m-0 max-h-[min(85dvh,28rem)] w-full max-w-none rounded-t-2xl border border-chaya-border bg-chaya-surface p-0 shadow-2xl backdrop:bg-black/40 dark:border-zinc-700 dark:bg-zinc-950 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id={titleId} className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {m.header.languageDialogTitle}
            </h2>
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] rounded-lg px-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              onClick={() => setOpen(false)}
            >
              {m.header.languageClose}
            </button>
          </div>
          <ul className="flex flex-col gap-1" role="list">
            {APP_LOCALES.map((code) => {
              const meta = LOCALE_META[code as AppLocale];
              const selected = active === code;
              return (
                <li key={code}>
                  <a
                    href={buildConsumerLocaleHref(pathname, searchParams, code)}
                    className={[
                      "flex min-h-[48px] items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold",
                      selected
                        ? "bg-chaya-primary text-chaya-on-primary"
                        : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900",
                    ].join(" ")}
                    aria-current={selected ? "true" : undefined}
                    lang={code}
                    onClick={() => {
                      setConsumerLocaleCookieClient(code);
                      setOpen(false);
                    }}
                  >
                    <span>{meta.nativeLabel}</span>
                    <span className={selected ? "opacity-90" : "text-zinc-500"}>{meta.shortLabel}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </dialog>
    </>
  );
}
