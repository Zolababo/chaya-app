/** 손님 메뉴판 — 한국어 + 주요 관광객 언어. */
export const DEFAULT_LOCALE = "ko" as const;

/** UI·쿠키·URL `?lang=` 값 (ISO 639-1 / BCP 47). */
export const APP_LOCALES = ["ko", "en", "ja", "zh-Hans", "zh-Hant"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

/** 점주 폼·DB translations_json 키 (ko 제외). */
export const TRANSLATION_LOCALES = APP_LOCALES.filter((l): l is Exclude<AppLocale, "ko"> => l !== "ko");

export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number];

export type LocaleMeta = {
  code: AppLocale;
  /** UI 짧은 라벨 (국가/지역 약어 — 사용자 눈에 익은 표기) */
  shortLabel: string;
  /** 언어 선택 목록 */
  nativeLabel: string;
};

export const LOCALE_META: Record<AppLocale, LocaleMeta> = {
  ko: { code: "ko", shortLabel: "KR", nativeLabel: "한국어" },
  en: { code: "en", shortLabel: "EN", nativeLabel: "English" },
  ja: { code: "ja", shortLabel: "JP", nativeLabel: "日本語" },
  "zh-Hans": { code: "zh-Hans", shortLabel: "CN", nativeLabel: "简体中文" },
  "zh-Hant": { code: "zh-Hant", shortLabel: "TW", nativeLabel: "繁體中文" },
};

const LOCALE_SET = new Set<string>(APP_LOCALES);

/** 예전 MVP에 있던 언어 — 쿠키/URL 호환용 영어 fallback */
const RETIRED_LOCALE_FALLBACK: Record<string, AppLocale> = {
  vi: "en",
  th: "en",
  ru: "en",
};

export function isAppLocale(raw: string | null | undefined): raw is AppLocale {
  if (!raw) return false;
  return LOCALE_SET.has(raw.trim());
}

export function parseAppLocale(raw: string | null | undefined): AppLocale {
  const s = raw?.trim();
  if (s && isAppLocale(s)) return s;
  if (s && s in RETIRED_LOCALE_FALLBACK) return RETIRED_LOCALE_FALLBACK[s];
  return DEFAULT_LOCALE;
}
