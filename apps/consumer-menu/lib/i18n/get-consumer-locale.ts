import { cookies } from "next/headers";

import { DEFAULT_LOCALE, type AppLocale, parseAppLocale } from "./locales";

const COOKIE_NAME = "chaya_locale";

export function getLocaleCookieName(): string {
  return COOKIE_NAME;
}

/** 서버 컴포넌트: 쿼리 `lang` 우선, 없으면 쿠키, 기본 ko. (`?lang=` 는 middleware 가 쿠키에 반영) */
export async function getConsumerLocale(langParam?: string | null): Promise<AppLocale> {
  if (langParam) {
    return parseAppLocale(langParam);
  }
  const store = await cookies();
  return parseAppLocale(store.get(COOKIE_NAME)?.value ?? null);
}

export async function getConsumerLocaleOrDefault(): Promise<AppLocale> {
  const locale = await getConsumerLocale();
  return locale || DEFAULT_LOCALE;
}
