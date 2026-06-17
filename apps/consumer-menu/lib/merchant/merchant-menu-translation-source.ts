import type { TranslationSource } from "@/lib/menus/hansik-lookup";
import type { MenuTranslationMeta } from "@/lib/menus/menu-translation-meta";
import {
  menuTranslationsMapToJson,
  type MenuTranslationsMap,
} from "@/lib/i18n/menu-translations";

/** DB `translations_json._meta.source` 및 점주 UI용 */
export type MenuTranslationSource = "hansik" | "gemini_new" | "gemini_cache";

export function parseMenuTranslationSource(raw: unknown): MenuTranslationSource | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const meta = (raw as Record<string, unknown>)._meta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const source = (meta as Record<string, unknown>).source;
  if (source === "hansik" || source === "gemini_new" || source === "gemini_cache") {
    return source;
  }
  return null;
}

export function okCodeForTranslationSource(source: TranslationSource): string {
  switch (source) {
    case "hansik":
      return "saved_hansik";
    case "gemini_new":
      return "saved_ai_new";
    case "gemini_cache":
      return "saved_ai_cache";
    default:
      return "saved";
  }
}

export type MenuTranslationNotice = {
  badge: string;
  title: string;
  detail: string;
};

export function menuTranslationNotice(source: MenuTranslationSource): MenuTranslationNotice {
  switch (source) {
    case "hansik":
      return {
        badge: "한식진흥원 DB",
        title: "한식진흥원 800선 공식 표기가 적용됐어요",
        detail: "이름·설명(영·일·중)은 외국어표기 길라잡이 DB에서 가져왔습니다.",
      };
    case "gemini_new":
      return {
        badge: "Gemini AI",
        title: "AI가 번역·설명을 새로 만들었어요",
        detail:
          "800선에 없는 메뉴명이라 Gemini AI가 이름·설명(영·일·중)과 맵기를 생성했습니다.",
      };
    case "gemini_cache":
      return {
        badge: "AI 캐시",
        title: "이전 AI 번역을 불러왔어요",
        detail: "같은 메뉴명으로 저장된 AI 번역 캐시를 재사용했습니다.",
      };
  }
}

/** locale 번역 + `_meta` 로 DB 저장용 JSON. */
export function buildTranslationsJsonWithMeta(
  merged: MenuTranslationsMap,
  source: TranslationSource,
  menuMeta?: MenuTranslationMeta | null,
  prevSource?: MenuTranslationSource | null,
): Record<string, unknown> | null {
  const locales = menuTranslationsMapToJson(merged);
  const metaBlock: Record<string, unknown> = {};

  const effectiveSource = source !== "none" ? (source as MenuTranslationSource) : prevSource;
  if (effectiveSource) metaBlock.source = effectiveSource;

  if (menuMeta?.spiceLevel !== undefined) metaBlock.spiceLevel = menuMeta.spiceLevel;

  const hasMeta = Object.keys(metaBlock).length > 0;
  if (!locales && !hasMeta) return null;
  if (!hasMeta) return locales;
  if (!locales) return { _meta: metaBlock };
  return { ...locales, _meta: metaBlock };
}
