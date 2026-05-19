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

/** 손님 화면 금액 — KRW. 한국어는 `1,000원`, 그 외는 `₩1,000` (Intl currency 기호 혼용 방지). */
export function formatConsumerMoney(amount: number, locale: AppLocale): string {
  const n = Math.round(amount).toLocaleString(NUMBER_LOCALE[locale] ?? "en-US");
  if (locale === "ko") return `${n}원`;
  return `₩${n}`;
}
