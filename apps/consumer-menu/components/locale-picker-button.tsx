"use client";

import { Globe } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  ConsumerHeaderIconButton,
  consumerHeaderIconClass,
  consumerHeaderIconStroke,
} from "@/components/consumer-header-icon-button";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { buildConsumerLocaleHref } from "@/lib/i18n/locale-href";
import { setConsumerLocaleCookieClient } from "@/lib/i18n/set-consumer-locale-cookie";
import { APP_LOCALES, LOCALE_META, type AppLocale } from "@/lib/i18n/locales";

const DISMISS_DRAG_PX = 72;

export function LocalePickerButton() {
  const { locale: active, m } = useConsumerLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);

  const activeMeta = LOCALE_META[active];
  const ariaLabel = `${m.header.languageOpen} — ${activeMeta.nativeLabel}`;

  const close = () => setOpen(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!open || !sheet) return;

    let startY = 0;
    let tracking = false;
    let dragging = false;

    const resetTransform = () => {
      sheet.style.transition = "transform 0.22s ease";
      sheet.style.transform = "";
      window.setTimeout(() => {
        sheet.style.transition = "";
      }, 230);
    };

    const onStart = (e: TouchEvent) => {
      if (e.target instanceof Element && e.target.closest("a, button")) return;
      startY = e.touches[0]?.clientY ?? 0;
      tracking = true;
      dragging = false;
      sheet.style.transition = "";
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const y = e.touches[0]?.clientY ?? startY;
      const dy = y - startY;
      if (!dragging) {
        if (dy <= 0) return;
        dragging = true;
      }
      if (dragging && dy > 0) {
        sheet.style.transform = `translateY(${dy}px)`;
        e.preventDefault();
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      if (!dragging) return;
      const y = e.changedTouches[0]?.clientY ?? startY;
      if (y - startY >= DISMISS_DRAG_PX) {
        close();
        sheet.style.transform = "";
        sheet.style.transition = "";
        return;
      }
      resetTransform();
    };

    sheet.addEventListener("touchstart", onStart, { passive: true });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);
    sheet.addEventListener("touchcancel", onEnd);
    return () => {
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("touchcancel", onEnd);
    };
  }, [open]);

  return (
    <>
      <ConsumerHeaderIconButton
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={titleId}
        aria-label={ariaLabel}
        title={ariaLabel}
        onClick={() => setOpen(true)}
      >
        <Globe className={consumerHeaderIconClass} aria-hidden strokeWidth={consumerHeaderIconStroke} />
      </ConsumerHeaderIconButton>

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40"
              role="presentation"
              onClick={close}
            >
              <div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="flex max-h-[min(85dvh,28rem)] w-full max-w-lg flex-col animate-[sheet-up_0.24s_ease] rounded-t-2xl border border-b-0 border-chaya-border bg-chaya-surface shadow-2xl dark:border-zinc-700 dark:bg-zinc-950"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600"
                  aria-hidden
                />
                <div className="flex flex-col p-4 pt-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 id={titleId} className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {m.header.languageDialogTitle}
                    </h2>
                    <button
                      type="button"
                      className="min-h-[44px] min-w-[44px] rounded-lg px-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      onClick={close}
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
                              close();
                            }}
                          >
                            <span>{meta.nativeLabel}</span>
                            <span className={selected ? "opacity-90" : "text-zinc-500"}>
                              {meta.shortLabel}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
