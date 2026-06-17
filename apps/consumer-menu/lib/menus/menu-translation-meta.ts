import type { MenuTranslationSource } from "@/lib/merchant/merchant-menu-translation-source";
import type { AppLocale } from "@/lib/i18n/locales";

/** DB `translations_json._meta` — locale 번역과 별도 메뉴 메타. */
export type MenuTranslationMeta = {
  /** 0 = 안 매움, 5 = 매우 매움 */
  spiceLevel?: number;
  source?: MenuTranslationSource;
};

function normalizeSpiceLevel(raw: unknown): number | undefined {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  return Math.min(5, Math.max(0, Math.round(raw)));
}

export function parseMenuTranslationMeta(raw: unknown): MenuTranslationMeta | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const meta = (raw as Record<string, unknown>)._meta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const o = meta as Record<string, unknown>;
  const spiceLevel = normalizeSpiceLevel(o.spiceLevel);
  const source =
    o.source === "hansik" || o.source === "gemini_new" || o.source === "gemini_cache"
      ? o.source
      : undefined;
  if (spiceLevel === undefined && !source) return null;
  return {
    ...(spiceLevel !== undefined ? { spiceLevel } : {}),
    ...(source ? { source } : {}),
  };
}

export function menuMetaFromGemini(raw: { spiceLevel?: number }): MenuTranslationMeta {
  const spiceLevel = normalizeSpiceLevel(raw.spiceLevel);
  return spiceLevel !== undefined ? { spiceLevel } : {};
}

export function needsMenuMetaFill(meta: MenuTranslationMeta | null | undefined): boolean {
  return meta?.spiceLevel === undefined;
}

/** 기존 메뉴 메타 유지 — 비어 있는 필드만 AI 결과로 채움. */
export function mergeMenuTranslationMeta(
  existing: MenuTranslationMeta | null | undefined,
  incoming: MenuTranslationMeta | null | undefined,
): MenuTranslationMeta {
  const out: MenuTranslationMeta = { ...(existing ?? {}) };
  if (out.spiceLevel === undefined && incoming?.spiceLevel !== undefined) {
    out.spiceLevel = incoming.spiceLevel;
  }
  return out;
}

export function formatSpiceEmojis(level: number | null | undefined): string {
  const n = normalizeSpiceLevel(level);
  if (n === undefined || n <= 0) return "";
  return "🌶".repeat(n);
}

/** 한국어 메뉴판에서는 맵기 이모지를 숨깁니다 (외국어 손님용). */
export function shouldShowMenuSpiceForLocale(locale: AppLocale): boolean {
  return locale !== "ko";
}
