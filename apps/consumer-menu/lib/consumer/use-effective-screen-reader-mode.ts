"use client";

import { useConsumerScreenReaderMode } from "@/lib/consumer/consumer-screen-reader-mode-context";
import { readScreenReaderMode } from "@/lib/consumer/screen-reader-mode-storage";

/**
 * SR 컨텍스트는 hydration 전 `false` — storage·부트 스크립트와 맞추기 위해
 * hydration 전에는 sessionStorage 값을 사용한다.
 */
export function useEffectiveScreenReaderMode(tenant: string) {
  const ctx = useConsumerScreenReaderMode();
  const screenReaderMode = ctx.hydrated
    ? ctx.screenReaderMode
    : readScreenReaderMode(tenant);

  return {
    ...ctx,
    screenReaderMode,
  };
}
