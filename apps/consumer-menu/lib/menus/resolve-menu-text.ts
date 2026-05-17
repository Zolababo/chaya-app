import type { AppLocale } from "@/lib/i18n/locales";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { MenuTranslationsMap } from "@/lib/i18n/menu-translations";
import type { ChayaMenuRow } from "./types";

function pickTranslated(
  map: MenuTranslationsMap,
  locale: AppLocale,
  field: "name" | "description" | "category",
): string | null {
  if (locale === DEFAULT_LOCALE) return null;
  const entry = map[locale as keyof MenuTranslationsMap];
  const v = entry?.[field];
  return v?.trim() ? v.trim() : null;
}

export function resolveMenuName(row: ChayaMenuRow, locale: AppLocale): string {
  if (locale === DEFAULT_LOCALE) return row.name;
  return pickTranslated(row.translations, locale, "name") ?? row.name;
}

export function resolveMenuDescription(row: ChayaMenuRow, locale: AppLocale): string | null {
  const base = row.description?.trim() || null;
  if (locale === DEFAULT_LOCALE) return base;
  return pickTranslated(row.translations, locale, "description") ?? base;
}

export function resolveMenuCategory(row: ChayaMenuRow, locale: AppLocale): string {
  const base = row.category?.trim() || "기타";
  if (locale === DEFAULT_LOCALE) return base;
  return pickTranslated(row.translations, locale, "category") ?? base;
}

/** 장바구니·표시용 — name/description/category 만 치환 */
export function resolveMenuRowForLocale(row: ChayaMenuRow, locale: AppLocale): ChayaMenuRow {
  if (locale === DEFAULT_LOCALE) return row;
  return {
    ...row,
    name: resolveMenuName(row, locale),
    description: resolveMenuDescription(row, locale),
    category: resolveMenuCategory(row, locale),
  };
}
