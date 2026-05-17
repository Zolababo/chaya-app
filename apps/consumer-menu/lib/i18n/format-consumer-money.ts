import type { AppLocale } from "./locales";

const NUMBER_LOCALE: Partial<Record<AppLocale, string>> = {
  ko: "ko-KR",
  ja: "ja-JP",
  en: "en-US",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  vi: "vi-VN",
  th: "th-TH",
  ru: "ru-RU",
};

/** 금액은 KRW. 로케일별 숫자·접미 표기만 다릅니다. */
export function formatConsumerMoney(amount: number, locale: AppLocale): string {
  const n = amount.toLocaleString(NUMBER_LOCALE[locale] ?? "en-US");
  if (locale === "ko") return `${n}원`;
  return `₩${n}`;
}
