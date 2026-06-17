import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import { syncGuestSessionCookieFromBrowser } from "@/lib/guest-session/sync-guest-session-cookie";

/** 브라우저에서만 호출. 없으면 UUID 생성 후 localStorage·쿠키 동기화. */
export function ensureGuestSessionInBrowser(): string {
  if (typeof window === "undefined") return "";
  try {
    let s = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (!s || s.length < 8) {
      s = crypto.randomUUID();
      localStorage.setItem(GUEST_SESSION_STORAGE_KEY, s);
    }
    syncGuestSessionCookieFromBrowser();
    return s;
  } catch {
    return "";
  }
}

export function readGuestSessionFromBrowser(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    return s && s.length >= 8 ? s : null;
  } catch {
    return null;
  }
}
