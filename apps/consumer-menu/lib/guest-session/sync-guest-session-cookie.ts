import { GUEST_SESSION_STORAGE_KEY } from "./constants";

const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

/** 브라우저에서만 호출. `localStorage` 비회원 세션을 `Path=/` 쿠키에 맞춥니다. */
export function syncGuestSessionCookieFromBrowser(): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  try {
    const v = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    if (!v || v.length < 8) {
      document.cookie = `${GUEST_SESSION_STORAGE_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
      return;
    }
    const enc = encodeURIComponent(v);
    document.cookie = `${GUEST_SESSION_STORAGE_KEY}=${enc}; Path=/; Max-Age=${ONE_YEAR_SEC}; SameSite=Lax${secure}`;
  } catch {
    /* private mode */
  }
}
