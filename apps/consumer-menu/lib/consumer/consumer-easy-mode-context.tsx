"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  BARRIER_FREE_ACTIVE_PREFS,
  readBarrierFreeMode,
  writeBarrierFreeMode,
} from "@/lib/consumer/barrier-free-mode-storage";
import type { ConsumerFontScale } from "@/lib/consumer/a11y-preferences-storage";

type ConsumerEasyModeContextValue = {
  /** hydration 후에만 true 가능 */
  barrierFreeMode: boolean;
  /** barrierFreeMode 와 동일 — 하위 탭·장바구니 스타일 */
  easyMode: boolean;
  a11yActive: boolean;
  fontScale: ConsumerFontScale;
  highContrast: boolean;
  voiceEnabled: boolean;
  hydrated: boolean;
  toggleBarrierFreeMode: () => void;
};

const ConsumerEasyModeContext = createContext<ConsumerEasyModeContextValue | null>(null);

const EASY_MODE_ATTR = "data-consumer-easy-mode";
const FONT_SCALE_ATTR = "data-consumer-font-scale";
const SR_MODE_ATTR = "data-consumer-screen-reader-mode";
const A11Y_PAD_ATTR = "data-consumer-a11y-pad";

function applyBarrierFreeDom(on: boolean, hydrated: boolean) {
  const root = document.documentElement;
  if (!hydrated) {
    root.removeAttribute(EASY_MODE_ATTR);
    root.removeAttribute(FONT_SCALE_ATTR);
    root.removeAttribute(SR_MODE_ATTR);
    root.removeAttribute(A11Y_PAD_ATTR);
    return;
  }
  if (on) {
    root.setAttribute(EASY_MODE_ATTR, "");
    root.setAttribute(A11Y_PAD_ATTR, "");
    root.setAttribute(FONT_SCALE_ATTR, "xl");
    root.setAttribute(SR_MODE_ATTR, "");
  } else {
    root.removeAttribute(EASY_MODE_ATTR);
    root.removeAttribute(A11Y_PAD_ATTR);
    root.removeAttribute(FONT_SCALE_ATTR);
    root.removeAttribute(SR_MODE_ATTR);
  }
}

type Props = {
  tenant: string;
  children: ReactNode;
};

export function ConsumerEasyModeProvider({ tenant, children }: Props) {
  const [barrierFreeMode, setBarrierFreeMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const on = readBarrierFreeMode(tenant);
    setBarrierFreeMode(on);
    setHydrated(true);
  }, [tenant]);

  useEffect(() => {
    applyBarrierFreeDom(barrierFreeMode, hydrated);
  }, [barrierFreeMode, hydrated]);

  const toggleBarrierFreeMode = useCallback(() => {
    setBarrierFreeMode((prev) => {
      const next = !prev;
      writeBarrierFreeMode(tenant, next);
      if (!next && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, [tenant]);

  const easyMode = hydrated && barrierFreeMode;
  const fontScale: ConsumerFontScale = easyMode ? BARRIER_FREE_ACTIVE_PREFS.fontScale : "normal";

  const value = useMemo(
    () => ({
      barrierFreeMode: easyMode,
      easyMode,
      a11yActive: easyMode,
      fontScale,
      highContrast: false,
      voiceEnabled: false,
      hydrated,
      toggleBarrierFreeMode,
    }),
    [easyMode, fontScale, hydrated, toggleBarrierFreeMode],
  );

  return (
    <ConsumerEasyModeContext.Provider value={value}>{children}</ConsumerEasyModeContext.Provider>
  );
}

export function useConsumerEasyMode(): ConsumerEasyModeContextValue {
  const ctx = useContext(ConsumerEasyModeContext);
  if (!ctx) {
    throw new Error("useConsumerEasyMode must be used within ConsumerEasyModeProvider");
  }
  return ctx;
}

export function useConsumerEasyModeOptional(): ConsumerEasyModeContextValue | null {
  return useContext(ConsumerEasyModeContext);
}
