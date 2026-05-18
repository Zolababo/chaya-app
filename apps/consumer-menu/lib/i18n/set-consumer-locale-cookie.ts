import { getLocaleCookieName } from "./consumer-locale-cookie";
import type { AppLocale } from "./locales";

const MAX_AGE_SEC = 60 * 60 * 24 * 365;

/** 브라우저에서 locale 쿠키 설정 (언어 선택 시 서버·클라이언트 일치). */
export function setConsumerLocaleCookieClient(locale: AppLocale): void {
  if (typeof document === "undefined") return;
  const name = getLocaleCookieName();
  document.cookie = `${name}=${encodeURIComponent(locale)}; path=/; max-age=${MAX_AGE_SEC}; samesite=lax`;
}
