import type { AppLocale } from "@/lib/i18n/locales";

export function formatOrderDateTime(iso: string, locale: AppLocale): string {
  try {
    const d = new Date(iso);
    const loc =
      locale === "ko"
        ? "ko-KR"
        : locale === "ja"
          ? "ja-JP"
          : locale.startsWith("zh")
            ? locale === "zh-Hant"
              ? "zh-Hant"
              : "zh-Hans"
            : "en-US";
    return d.toLocaleString(loc, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
