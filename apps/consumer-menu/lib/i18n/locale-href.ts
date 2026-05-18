import type { AppLocale } from "./locales";

/** 언어 전환 링크 — `lang` 쿼리로 middleware 가 쿠키를 갱신합니다 (ko 포함). */
export function buildConsumerLocaleHref(
  pathname: string,
  searchParams: URLSearchParams,
  locale: AppLocale,
): string {
  const q = new URLSearchParams(searchParams.toString());
  q.set("lang", locale);
  const qs = q.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
