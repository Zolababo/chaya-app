"use client";

import { useEffect, useState } from "react";

import {
  OPS_DESKTOP_VIEW_MEDIA,
  OPS_DESKTOP_WIDE_MEDIA,
  OPS_WIDE_LANDSCAPE_MEDIA,
} from "@/lib/responsive/ops-desktop-view";

export {
  OPS_DESKTOP_VIEW_MEDIA,
  OPS_DESKTOP_WIDE_MEDIA,
  OPS_WIDE_LANDSCAPE_MEDIA,
} from "@/lib/responsive/ops-desktop-view";

/** PC(마우스) — ops 사이드바·탑바 셸 */
export function useOpsDesktopView(): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(OPS_DESKTOP_VIEW_MEDIA);
    const sync = () => {
      const desktop = mq.matches;
      document.documentElement.setAttribute("data-ops-view", desktop ? "desktop" : "compact");
      setMatches(desktop);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return matches;
}

/** PC + 1024px+ — 매장 2-pane 등 */
export function useOpsWideLandscape(): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(OPS_DESKTOP_WIDE_MEDIA);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return matches;
}
