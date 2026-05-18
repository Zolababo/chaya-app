/** 손님 UI locale 쿠키 — 서버·클라이언트 공용 (next/headers 없음). */
export const CONSUMER_LOCALE_COOKIE = "chaya_locale";

export function getLocaleCookieName(): string {
  return CONSUMER_LOCALE_COOKIE;
}
