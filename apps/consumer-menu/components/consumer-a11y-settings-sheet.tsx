"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BarrierFreeModeIcon } from "@/components/barrier-free-mode-icon";
import type { ConsumerFontScale } from "@/lib/consumer/a11y-preferences-storage";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import {
  isBarrierFreeMenuPath,
  isMenuHomePath,
  menuPathForEasyMode,
} from "@/lib/consumer/easy-mode-routes";
import { useConsumerVoiceAnnounce } from "@/lib/consumer/use-consumer-voice-announce";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";

type Props = {
  tenant: string;
  open: boolean;
  onClose: () => void;
};

const DISMISS_DRAG_PX = 72;

function ToggleSwitch({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-chaya-primary" : "bg-zinc-300"}`}
      aria-hidden
    >
      <span
        className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function ConsumerA11ySettingsSheet({ tenant, open, onClose }: Props) {
  const { m } = useConsumerLocale();
  const s = m.settings;
  const router = useRouter();
  const pathname = usePathname();
  const navHref = useConsumerNavHref(tenant);
  const titleId = useId();
  const fontGroupId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const { fontScale, highContrast, voiceEnabled, setFontScale, setHighContrast, setVoiceEnabled } =
    useConsumerEasyMode();
  const { speak, cancelSpeech } = useConsumerVoiceAnnounce();
  const [draftFont, setDraftFont] = useState<ConsumerFontScale>(fontScale);
  const [draftVoice, setDraftVoice] = useState(voiceEnabled);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDraftFont(fontScale);
    setDraftVoice(voiceEnabled);
  }, [open, fontScale, voiceEnabled]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

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
      if (e.target instanceof Element && e.target.closest("button, a, input, select, textarea")) return;
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
        onClose();
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
  }, [open, onClose]);

  const pickFont = (scale: ConsumerFontScale) => {
    setDraftFont(scale);
    setFontScale(scale);
    if (scale === "normal" && isBarrierFreeMenuPath(pathname)) {
      onClose();
      router.push(navHref(menuPathForEasyMode(tenant, false)));
    } else if (scale === "xl" && isMenuHomePath(pathname, tenant) && !isBarrierFreeMenuPath(pathname)) {
      onClose();
      router.push(navHref(menuPathForEasyMode(tenant, true)));
    }
  };

  const toggleVoice = () => {
    const next = !draftVoice;
    setDraftVoice(next);
    setVoiceEnabled(next);
    if (next) speak(s.voiceOn);
    else cancelSpeech();
  };

  const toggleContrast = () => {
    setHighContrast(!highContrast);
  };

  const fontOptions: { scale: ConsumerFontScale; label: string; sampleClass: string }[] = [
    { scale: "normal", label: s.fontNormal, sampleClass: "text-sm font-bold" },
    { scale: "large", label: s.fontLarge, sampleClass: "text-base font-bold" },
    { scale: "xl", label: s.fontXl, sampleClass: "text-lg font-bold" },
  ];

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(88dvh,36rem)] w-full max-w-lg flex-col animate-[sheet-up_0.28s_ease-out] rounded-t-2xl border border-chaya-border bg-chaya-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 pt-5">
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-zinc-200" aria-hidden role="presentation" />
          <div className="mb-1 flex items-center gap-2">
            <BarrierFreeModeIcon className="size-6 shrink-0" />
            <h2 id={titleId} className="text-base font-extrabold text-zinc-900">
              {s.title}
            </h2>
          </div>
          <p className="text-xs font-medium leading-relaxed text-zinc-500">{s.intro}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <section className="mb-5" aria-labelledby={`${titleId}-font`}>
            <p
              id={`${titleId}-font`}
              className="mb-2 text-xs font-extrabold tracking-wide text-zinc-600"
            >
              {s.fontSizeLabel}
            </p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby={`${titleId}-font`}>
              {fontOptions.map(({ scale, label, sampleClass }) => {
                const selected = draftFont === scale;
                return (
                  <button
                    key={scale}
                    type="button"
                    role="radio"
                    name={fontGroupId}
                    aria-checked={selected}
                    className={`rounded-xl border-2 px-2 py-3 text-center transition-colors ${
                      selected
                        ? "border-chaya-primary bg-chaya-primary/10 ring-1 ring-chaya-primary/30"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                    onClick={() => pickFont(scale)}
                  >
                    <span className={`block text-zinc-800 ${sampleClass}`}>가</span>
                    <span
                      className={`mt-1 block text-[11px] font-bold ${selected ? "text-chaya-primary" : "text-zinc-500"}`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            {draftFont === "xl" ? (
              <p className="mt-2 text-xs text-zinc-500">
                {s.listMenuHint}{" "}
                <Link
                  href={navHref(menuPathForEasyMode(tenant, true))}
                  className="font-semibold text-chaya-primary underline-offset-2 hover:underline"
                  onClick={onClose}
                >
                  {s.listMenuLink}
                </Link>
              </p>
            ) : null}
          </section>

          <section className="space-y-2" aria-label={s.displayLabel}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-left"
              onClick={toggleContrast}
              aria-pressed={highContrast}
            >
              <span>
                <span className="block text-sm font-bold text-zinc-900">{s.highContrastName}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{s.highContrastDesc}</span>
              </span>
              <ToggleSwitch on={highContrast} label={s.highContrastName} />
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-left"
              onClick={toggleVoice}
              aria-pressed={draftVoice}
            >
              <span>
                <span className="block text-sm font-bold text-zinc-900">{s.voiceName}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{s.voiceDesc}</span>
              </span>
              <ToggleSwitch on={draftVoice} label={s.voiceName} />
            </button>
          </section>
        </div>

        <div className="shrink-0 border-t border-chaya-border/60 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            className="w-full rounded-xl bg-chaya-primary py-3.5 text-sm font-extrabold text-chaya-on-primary"
            onClick={onClose}
          >
            {s.done}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
