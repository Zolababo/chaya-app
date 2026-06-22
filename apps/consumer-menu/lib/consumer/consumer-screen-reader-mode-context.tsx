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
  screenReaderMode: boolean;
  setScreenReaderMode: (on: boolean) => void;
  toggleScreenReaderMode: () => void;
};

const ConsumerScreenReaderModeContext =
  createContext<ConsumerScreenReaderModeContextValue | null>(null);

function applyDomFlag(on: boolean, hydrated: boolean) {
  const root = document.documentElement;
  if (!hydrated || !on) {
    root.removeAttribute(SR_MODE_ATTR);
    return;
  }
  root.setAttribute(SR_MODE_ATTR, "");
}

type Props = {
  tenant: string;
  children: ReactNode;
};

export function ConsumerScreenReaderModeProvider({ tenant, children }: Props) {
  const [screenReaderMode, setOn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setOn(readScreenReaderMode(tenant));
  }, [tenant]);

  useEffect(() => {
    applyDomFlag(screenReaderMode, hydrated);
  }, [screenReaderMode, hydrated]);

  const setScreenReaderMode = useCallback(
    (on: boolean) => {
      setOn(on);
      writeScreenReaderMode(tenant, on);
    },
    [tenant],
  );

  const toggleScreenReaderMode = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      writeScreenReaderMode(tenant, next);
      return next;
    });
  }, [tenant]);

  const value = useMemo(
    () => ({
      screenReaderMode: hydrated && screenReaderMode,
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
