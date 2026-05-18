import type { AppLocale } from "./locales";

export function buildConsumerLocaleHref(
  pathname: string,
  searchParams: URLSearchParams,
  locale: AppLocale,
): string {
  const q = new URLSearchParams(searchParams.toString());
  if (locale === "ko") {
    q.delete("lang");
  } else {
    q.set("lang", locale);
  }
  const qs = q.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
