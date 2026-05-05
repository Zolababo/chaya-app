"use client";

import { useEffect } from "react";

import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import { syncGuestSessionCookieFromBrowser } from "@/lib/guest-session/sync-guest-session-cookie";

export function GuestSessionCookieSync() {
  useEffect(() => {
    syncGuestSessionCookieFromBrowser();
    const onStorage = (e: StorageEvent) => {
      if (e.key === GUEST_SESSION_STORAGE_KEY) syncGuestSessionCookieFromBrowser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
