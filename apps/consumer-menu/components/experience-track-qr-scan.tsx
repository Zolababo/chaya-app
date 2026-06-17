"use client";

import { useEffect, useRef } from "react";

import { trackExperienceEvent } from "@/lib/experience/track-experience-event";
import {
  ensureGuestSessionInBrowser,
  readGuestSessionFromBrowser,
} from "@/lib/guest-session/ensure-guest-session";
import {
  hasQrScanFiredThisTab,
  markQrScanFiredThisTab,
} from "@/lib/guest-session/qr-scan-tab-session";

type Props = {
  tenant: string;
};

/** 메뉴판 홈 — 탭당 qr_scan 1회. revisit은 DB에 과거 qr_scan이 있을 때만(서버). */
export function ExperienceTrackQrScan({ tenant }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || hasQrScanFiredThisTab(tenant)) return;
    ensureGuestSessionInBrowser();
    const guestSessionId = readGuestSessionFromBrowser();
    if (!guestSessionId) return;
    sent.current = true;
    markQrScanFiredThisTab(tenant);

    void trackExperienceEvent({
      guestSessionId,
      tenantSlug: tenant,
      eventType: "qr_scan",
    });
  }, [tenant]);

  return null;
}
