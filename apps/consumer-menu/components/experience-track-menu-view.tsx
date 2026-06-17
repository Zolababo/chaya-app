"use client";

import { useEffect, useRef } from "react";

import { CONSUMER_EXPERIENCE_TRACK_MENU_VIEW } from "@/lib/experience/experience-tracking-flags";
import { trackExperienceEvent } from "@/lib/experience/track-experience-event";
import {
  ensureGuestSessionInBrowser,
  readGuestSessionFromBrowser,
} from "@/lib/guest-session/ensure-guest-session";

type Props = {
  tenant: string;
  menuId: string;
};

/** `CONSUMER_EXPERIENCE_TRACK_MENU_VIEW` 가 true 일 때만 동작 (기본 OFF). */
export function ExperienceTrackMenuView({ tenant, menuId }: Props) {
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!CONSUMER_EXPERIENCE_TRACK_MENU_VIEW) return;
    if (sent.current === menuId) return;
    ensureGuestSessionInBrowser();
    const guestSessionId = readGuestSessionFromBrowser();
    if (!guestSessionId) return;
    sent.current = menuId;

    void trackExperienceEvent({
      guestSessionId,
      tenantSlug: tenant,
      eventType: "menu_view",
      menuId,
    });
  }, [tenant, menuId]);

  return null;
}
