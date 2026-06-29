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
  readScreenReaderMode,
  writeScreenReaderMode,
} from "@/lib/consumer/screen-reader-mode-storage";

const SR_MODE_ATTR = "data-consumer-screen-reader-mode";

type ConsumerScreenReaderModeContextValue = {
  /** hydration 완료 후에만 신뢰 — 라우트·링크는 `useEffectiveScreenReaderMode` 사용 */
  screenReaderMode: boolean;
  hydrated: boolean;
  setScreenReaderMode: (on: boolean) => void;
  toggleScreenReaderMode: () => void;
};

const ConsumerScreenReaderModeContext =
  createContext<ConsumerScreenReaderModeContextValue | null>(null);

function applyScreenReaderDomFlag(on: boolean) {
  const root = document.documentElement;
  if (on) {
    root.setAttribute(SR_MODE_ATTR, "");
  } else {
    root.removeAttribute(SR_MODE_ATTR);
  }
}

type Props = {
  tenant: string;
  children: ReactNode;
};

export function ConsumerScreenReaderModeProvider({ tenant, children }: Props) {
  const [screenReaderMode, setOn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const on = readScreenReaderMode(tenant);
    setOn(on);
    applyScreenReaderDomFlag(on);
    setHydrated(true);
  }, [tenant]);

  const setScreenReaderMode = useCallback(
    (on: boolean) => {
      setOn(on);
      writeScreenReaderMode(tenant, on);
      applyScreenReaderDomFlag(on);
    },
    [tenant],
  );

  const toggleScreenReaderMode = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      writeScreenReaderMode(tenant, next);
      applyScreenReaderDomFlag(next);
      return next;
    });
  }, [tenant]);

  const value = useMemo(
    () => ({
      screenReaderMode: hydrated ? screenReaderMode : false,
      hydrated,
      setScreenReaderMode,
      toggleScreenReaderMode,
    }),
    [hydrated, screenReaderMode, setScreenReaderMode, toggleScreenReaderMode],
  );

  return (
    <ConsumerScreenReaderModeContext.Provider value={value}>
      {children}
    </ConsumerScreenReaderModeContext.Provider>
  );
}

export function useConsumerScreenReaderMode(): ConsumerScreenReaderModeContextValue {
  const ctx = useContext(ConsumerScreenReaderModeContext);
  if (!ctx) {
    throw new Error(
      "useConsumerScreenReaderMode must be used within ConsumerScreenReaderModeProvider",
    );
  }
  return ctx;
}
