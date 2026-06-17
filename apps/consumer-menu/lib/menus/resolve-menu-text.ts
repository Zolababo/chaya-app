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

const CATEGORY_LABEL_FALLBACK: Partial<Record<AppLocale, Record<string, string>>> = {
  en: {
    음식: "Food",
    음료: "Drinks",
    메인: "Main",
    사이드: "Sides",
    디저트: "Dessert",
    기타: "Other",
  },
  ja: {
    음식: "食事",
    음료: "飲み物",
    메인: "メイン",
    사이드: "サイド",
    디저트: "デザート",
    기타: "その他",
  },
  "zh-Hans": {
    음식: "食物",
    음료: "饮料",
    메인: "主菜",
    사이드: "配菜",
    디저트: "甜品",
    기타: "其他",
  },
  "zh-Hant": {
    음식: "食物",
    음료: "飲料",
    메인: "主菜",
    사이드: "配菜",
    디저트: "甜品",
    기타: "其他",
  },
};

function fallbackCategoryLabel(canonical: string, locale: AppLocale): string | null {
  return CATEGORY_LABEL_FALLBACK[locale]?.[canonical] ?? null;
}

export function resolveMenuCategory(row: ChayaMenuRow, locale: AppLocale): string {
  const base = row.category?.trim() || "기타";
  if (locale === DEFAULT_LOCALE) return base;
  return (
    pickTranslated(row.translations, locale, "category") ??
    fallbackCategoryLabel(base, locale) ??
    base
  );
}

/** 칩·섹션 제목용 — canonical(원문) 키 → 현재 locale 표시명 */
export function buildCategoryDisplayMap(
  items: ChayaMenuRow[],
  canonicalCategories: string[],
  locale: AppLocale,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const key of canonicalCategories) {
    const sample = items.find((i) => (i.category?.trim() || "기타") === key);
    map.set(key, sample ? resolveMenuCategory(sample, locale) : key);
  }
  return map;
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
