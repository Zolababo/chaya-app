"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type MerchantHeaderOverlay = "announcements" | "more" | null;

type Ctx = {
  overlay: MerchantHeaderOverlay;
  openOverlay: (next: Exclude<MerchantHeaderOverlay, null>) => void;
  closeOverlay: () => void;
};

const MerchantHeaderOverlayContext = createContext<Ctx | null>(null);

export function MerchantHeaderOverlayProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<MerchantHeaderOverlay>(null);
  const openOverlay = useCallback((next: Exclude<MerchantHeaderOverlay, null>) => {
    setOverlay(next);
  }, []);
  const closeOverlay = useCallback(() => setOverlay(null), []);
  const value = useMemo(
    () => ({ overlay, openOverlay, closeOverlay }),
    [overlay, openOverlay, closeOverlay],
  );
  return (
    <MerchantHeaderOverlayContext.Provider value={value}>{children}</MerchantHeaderOverlayContext.Provider>
  );
}

export function useMerchantHeaderOverlay() {
  return useContext(MerchantHeaderOverlayContext);
}
