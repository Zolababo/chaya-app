"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { readEasyMode, writeEasyMode } from "@/lib/consumer/easy-mode-storage";

type ConsumerEasyModeContextValue = {
  /** hydration 후에만 true 가능 */
  easyMode: boolean;
  enterEasyMode: () => void;
  exitEasyMode: () => void;
};

const ConsumerEasyModeContext = createContext<ConsumerEasyModeContextValue | null>(null);

const HTML_ATTR = "data-consumer-easy-mode";

type Props = {
  tenant: string;
  children: ReactNode;
};

export function ConsumerEasyModeProvider({ tenant, children }: Props) {
  const pathname = usePathname();
  const [easyMode, setEasyMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setEasyMode(readEasyMode(tenant));
  }, [tenant]);

  useEffect(() => {
    if (!hydrated) return;
    if (pathname.includes("/barrier-free")) {
      writeEasyMode(tenant, true);
      setEasyMode(true);
    }
  }, [pathname, tenant, hydrated]);

  useEffect(() => {
    const root = document.documentElement;
    if (easyMode && hydrated) {
      root.setAttribute(HTML_ATTR, "");
    } else {
      root.removeAttribute(HTML_ATTR);
    }
    return () => root.removeAttribute(HTML_ATTR);
  }, [easyMode, hydrated]);

  const enterEasyMode = useCallback(() => {
    writeEasyMode(tenant, true);
    setEasyMode(true);
  }, [tenant]);

  const exitEasyMode = useCallback(() => {
    writeEasyMode(tenant, false);
    setEasyMode(false);
  }, [tenant]);

  const value = useMemo(
    () => ({
      easyMode: hydrated && easyMode,
      enterEasyMode,
      exitEasyMode,
    }),
    [hydrated, easyMode, enterEasyMode, exitEasyMode],
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

/** Provider 밖(테스트) 또는 optional 사용 */
export function useConsumerEasyModeOptional(): ConsumerEasyModeContextValue | null {
  return useContext(ConsumerEasyModeContext);
}
