import type { AppLocale } from "@/lib/i18n/locales";

/** 손님 주문 카드용 상대 시각 (로케일 대략 매핑) */
export function formatRelativeTimeFromNow(iso: string, locale: AppLocale): string | null {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtfLocale =
    locale === "ko"
      ? "ko-KR"
      : locale === "ja"
        ? "ja-JP"
        : locale.startsWith("zh")
          ? locale === "zh-Hant"
            ? "zh-TW"
            : "zh-CN"
          : "en-US";

  try {
    const rtf = new Intl.RelativeTimeFormat(rtfLocale, { numeric: "auto" });
    if (abs < 60) return rtf.format(Math.round(diffSec), "second");
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
    return rtf.format(Math.round(diffSec / 86400), "day");
  } catch {
    return null;
  }
}
