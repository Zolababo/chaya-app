"use client";

import { useCallback } from "react";

import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { speechLangForLocale } from "@/lib/consumer/speech-lang-for-locale";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

export function useConsumerVoiceAnnounce() {
  const { voiceEnabled } = useConsumerEasyMode();
  const { locale } = useConsumerLocale();

  const speak = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!voiceEnabled || !trimmed) return;
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(trimmed);
      utter.lang = speechLangForLocale(locale);
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    },
    [voiceEnabled, locale],
  );

  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, cancelSpeech };
}
