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
  DEFAULT_A11Y_PREFERENCES,
  readA11yPreferences,
  writeA11yPreferences,
  type ConsumerA11yPreferences,
  type ConsumerFontScale,
} from "@/lib/consumer/a11y-preferences-storage";

type ConsumerEasyModeContextValue = {
  /** hydration 후에만 true 가능 — large·xl */
  easyMode: boolean;
  fontScale: ConsumerFontScale;
  highContrast: boolean;
  voiceEnabled: boolean;
  /** 글자·대비·음성 중 하나라도 켜짐 */
  a11yActive: boolean;
  enterEasyMode: () => void;
  exitEasyMode: () => void;
  setFontScale: (scale: ConsumerFontScale) => void;
  setHighContrast: (on: boolean) => void;
  setVoiceEnabled: (on: boolean) => void;
  applyPreferences: (prefs: ConsumerA11yPreferences) => void;
};

const ConsumerEasyModeContext = createContext<ConsumerEasyModeContextValue | null>(null);

const EASY_MODE_ATTR = "data-consumer-easy-mode";
const FONT_SCALE_ATTR = "data-consumer-font-scale";
const HIGH_CONTRAST_ATTR = "data-consumer-high-contrast";
const A11Y_PAD_ATTR = "data-consumer-a11y-pad";

function applyDomPreferences(prefs: ConsumerA11yPreferences, hydrated: boolean) {
  const root = document.documentElement;
  if (!hydrated) {
    root.removeAttribute(EASY_MODE_ATTR);
    root.removeAttribute(FONT_SCALE_ATTR);
    root.removeAttribute(HIGH_CONTRAST_ATTR);
    root.removeAttribute(A11Y_PAD_ATTR);
    return;
  }
  if (prefs.fontScale === "normal") {
    root.removeAttribute(EASY_MODE_ATTR);
    root.removeAttribute(FONT_SCALE_ATTR);
    root.removeAttribute(A11Y_PAD_ATTR);
  } else {
    root.setAttribute(EASY_MODE_ATTR, "");
    root.setAttribute(A11Y_PAD_ATTR, "");
    if (prefs.fontScale === "xl") {
      root.setAttribute(FONT_SCALE_ATTR, "xl");
    } else {
      root.removeAttribute(FONT_SCALE_ATTR);
    }
  }
  if (prefs.highContrast) {
    root.setAttribute(HIGH_CONTRAST_ATTR, "");
  } else {
    root.removeAttribute(HIGH_CONTRAST_ATTR);
  }
}

type Props = {
  tenant: string;
  children: ReactNode;
};

export function ConsumerEasyModeProvider({ tenant, children }: Props) {
  const [prefs, setPrefs] = useState<ConsumerA11yPreferences>(DEFAULT_A11Y_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  const persist = useCallback(
    (next: ConsumerA11yPreferences) => {
      setPrefs(next);
      writeA11yPreferences(tenant, next);
    },
    [tenant],
  );

  useEffect(() => {
    setHydrated(true);
    setPrefs(readA11yPreferences(tenant));
  }, [tenant]);

  useEffect(() => {
    applyDomPreferences(prefs, hydrated);
  }, [prefs, hydrated]);

  useEffect(() => {
    if (!hydrated || !prefs.voiceEnabled) return;
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [hydrated, prefs.voiceEnabled]);

  const applyPreferences = useCallback(
    (next: ConsumerA11yPreferences) => {
      persist(next);
    },
    [persist],
  );

  const setFontScale = useCallback(
    (fontScale: ConsumerFontScale) => {
      setPrefs((prev) => {
        const next = { ...prev, fontScale };
        writeA11yPreferences(tenant, next);
        return next;
      });
    },
    [tenant],
  );

  const setHighContrast = useCallback(
    (highContrast: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, highContrast };
        writeA11yPreferences(tenant, next);
        return next;
      });
    },
    [tenant],
  );

  const setVoiceEnabled = useCallback(
    (voiceEnabled: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, voiceEnabled };
        writeA11yPreferences(tenant, next);
        return next;
      });
    },
    [tenant],
  );

  const enterEasyMode = useCallback(() => {
    setPrefs((prev) => {
      const fontScale: ConsumerFontScale = prev.fontScale === "xl" ? "xl" : "large";
      const next = { ...prev, fontScale };
      writeA11yPreferences(tenant, next);
      return next;
    });
  }, [tenant]);

  const exitEasyMode = useCallback(() => {
    setPrefs((prev) => {
      const next = { ...prev, fontScale: "normal" as const };
      writeA11yPreferences(tenant, next);
      return next;
    });
  }, [tenant]);

  const easyMode = hydrated && prefs.fontScale !== "normal";
  const a11yActive =
    hydrated && (prefs.fontScale !== "normal" || prefs.highContrast || prefs.voiceEnabled);

  const value = useMemo(
    () => ({
      easyMode,
      fontScale: hydrated ? prefs.fontScale : "normal",
      highContrast: hydrated && prefs.highContrast,
      voiceEnabled: hydrated && prefs.voiceEnabled,
      a11yActive,
      enterEasyMode,
      exitEasyMode,
      setFontScale,
      setHighContrast,
      setVoiceEnabled,
      applyPreferences,
    }),
    [
      easyMode,
      hydrated,
      prefs.fontScale,
      prefs.highContrast,
      prefs.voiceEnabled,
      a11yActive,
      enterEasyMode,
      exitEasyMode,
      setFontScale,
      setHighContrast,
      setVoiceEnabled,
      applyPreferences,
    ],
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
