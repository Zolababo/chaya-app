import type { AppLocale } from "@/lib/i18n/locales";

/** Web Speech API `utterance.lang` */
export function speechLangForLocale(locale: AppLocale): string {
  switch (locale) {
    case "ja":
      return "ja-JP";
    case "zh-Hans":
      return "zh-CN";
    case "zh-Hant":
      return "zh-TW";
    case "en":
      return "en-US";
    default:
      return "ko-KR";
  }
}
