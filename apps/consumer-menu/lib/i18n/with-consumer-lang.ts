import type { AppLocale } from "./locales";

/** 내부 링크에 `lang` 쿼리를 붙여 서버·미들웨어·쿠키가 같은 locale 을 씁니다. */
export function withConsumerLang(path: string, locale: AppLocale): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${encodeURIComponent(locale)}`;
}
