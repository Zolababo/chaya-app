"use client";

import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

export function ConsumerVoiceActiveBadge() {
  const { voiceEnabled } = useConsumerEasyMode();
  const { m } = useConsumerLocale();

  if (!voiceEnabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[3.25rem] z-30 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <span className="rounded-full bg-chaya-primary px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md">
        🔊 {m.settings.voiceBadge}
      </span>
    </div>
  );
}
