"use client";

import { useEffect, useState } from "react";

/** 넓은 가로 콘솔 — 점주 2-pane (태블릿 가로·1024+) */
export const MERCHANT_WIDE_LANDSCAPE_MEDIA = "(min-width: 1024px) and (orientation: landscape)";

export function useMerchantWideLandscape(): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MERCHANT_WIDE_LANDSCAPE_MEDIA);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return matches;
}
