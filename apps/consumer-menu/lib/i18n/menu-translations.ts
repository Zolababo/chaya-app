import type { TranslationLocale } from "./locales";
import { TRANSLATION_LOCALES, isAppLocale } from "./locales";

export type MenuLocaleFields = {
  name?: string;
  description?: string;
  category?: string;
};

/** DB `translations_json` 형태. */
export type MenuTranslationsMap = Partial<Record<TranslationLocale, MenuLocaleFields>>;

export function parseMenuTranslationsMap(raw: unknown): MenuTranslationsMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: MenuTranslationsMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!TRANSLATION_LOCALES.includes(key as TranslationLocale)) continue;
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const o = value as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const description = typeof o.description === "string" ? o.description.trim() : "";
    const category = typeof o.category === "string" ? o.category.trim() : "";
    if (!name && !description && !category) continue;
    out[key as TranslationLocale] = {
      ...(name ? { name: name.slice(0, 200) } : {}),
      ...(description ? { description: description.slice(0, 2000) } : {}),
      ...(category ? { category: category.slice(0, 120) } : {}),
    };
  }
  return out;
}

export function menuTranslationsMapToJson(map: MenuTranslationsMap): Record<string, MenuLocaleFields> | null {
  const entries = Object.entries(map).filter(
    ([k, v]) => isAppLocale(k) && k !== "ko" && v && (v.name || v.description || v.category),
  );
  if (entries.length === 0) return null;
  const json: Record<string, MenuLocaleFields> = {};
  for (const [k, v] of entries) {
    json[k] = v;
  }
  return json;
}

export function parseTranslationsFromForm(formData: FormData): MenuTranslationsMap {
  const out: MenuTranslationsMap = {};
  for (const loc of TRANSLATION_LOCALES) {
    const name = String(formData.get(`tr_${loc}_name`) ?? "").trim().slice(0, 200);
    const description = String(formData.get(`tr_${loc}_description`) ?? "").trim().slice(0, 2000);
    const category = String(formData.get(`tr_${loc}_category`) ?? "").trim().slice(0, 120);
    if (!name && !description && !category) continue;
    out[loc] = {
      ...(name ? { name } : {}),
      ...(description ? { description } : {}),
      ...(category ? { category } : {}),
    };
  }
  return out;
}

/** 폼 기본값용 */
export function getTranslationField(
  map: MenuTranslationsMap,
  locale: TranslationLocale,
  field: keyof MenuLocaleFields,
): string {
  return map[locale]?.[field] ?? "";
}
