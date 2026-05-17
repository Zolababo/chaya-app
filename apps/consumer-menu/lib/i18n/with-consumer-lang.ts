import { DEFAULT_LOCALE, type AppLocale } from "./locales";

/** 비한국어일 때만 `?lang=` 를 붙입니다. */
export function withConsumerLang(path: string, locale: AppLocale): string {
  if (locale === DEFAULT_LOCALE) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${encodeURIComponent(locale)}`;
}
