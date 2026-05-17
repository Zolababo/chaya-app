/** 손님 메뉴판 MVP locale (한국 방문 외국인 주요국). */
export const DEFAULT_LOCALE = "ko" as const;

export const APP_LOCALES = [
  "ko",
  "en",
  "ja",
  "zh-Hans",
  "zh-Hant",
  "vi",
  "th",
  "ru",
] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

/** 점주 폼·DB translations_json 키 (ko 제외). */
export const TRANSLATION_LOCALES = APP_LOCALES.filter((l): l is Exclude<AppLocale, "ko"> => l !== "ko");

export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number];

export type LocaleMeta = {
  code: AppLocale;
  /** UI 짧은 라벨 */
  shortLabel: string;
  /** 언어 선택 목록 */
  nativeLabel: string;
};

export const LOCALE_META: Record<AppLocale, LocaleMeta> = {
  ko: { code: "ko", shortLabel: "KO", nativeLabel: "한국어" },
  en: { code: "en", shortLabel: "EN", nativeLabel: "English" },
  ja: { code: "ja", shortLabel: "JA", nativeLabel: "日本語" },
  "zh-Hans": { code: "zh-Hans", shortLabel: "简", nativeLabel: "简体中文" },
  "zh-Hant": { code: "zh-Hant", shortLabel: "繁", nativeLabel: "繁體中文" },
  vi: { code: "vi", shortLabel: "VI", nativeLabel: "Tiếng Việt" },
  th: { code: "th", shortLabel: "TH", nativeLabel: "ไทย" },
  ru: { code: "ru", shortLabel: "RU", nativeLabel: "Русский" },
};

const LOCALE_SET = new Set<string>(APP_LOCALES);

export function isAppLocale(raw: string | null | undefined): raw is AppLocale {
  if (!raw) return false;
  return LOCALE_SET.has(raw.trim());
}

export function parseAppLocale(raw: string | null | undefined): AppLocale {
  const s = raw?.trim();
  if (s && isAppLocale(s)) return s;
  return DEFAULT_LOCALE;
}
