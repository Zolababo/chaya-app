/**
 * 한식진흥원 DB 조회 헬퍼 (서버 전용).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { lookupHansik } from "./hansik-db";
import {
  geminiTranslationFailureHint,
  isGeminiConfigured,
  translateMenuWithGemini,
} from "./gemini-translate";
import {
  mergeMenuTranslationMeta,
  menuMetaFromGemini,
  needsMenuMetaFill,
  type MenuTranslationMeta,
} from "./menu-translation-meta";
import { readTranslationCache, writeTranslationCache } from "./translation-cache";
import { sanitizeMenuDescriptionForDiner } from "./menu-description-sanitize";
import type { MenuLocaleFields, MenuTranslationsMap } from "@/lib/i18n/menu-translations";
import type { TranslationLocale } from "@/lib/i18n/locales";

export type { HansikEntry } from "./hansik-db";

const DESC_LOCALES: TranslationLocale[] = ["en", "ja", "zh-Hans", "zh-Hant"];

type LocalePack = {
  en?: string;
  ja?: string;
  zhCN?: string;
  zhTW?: string;
  enDesc?: string;
  jaDesc?: string;
  zhCNDesc?: string;
  zhTWDesc?: string;
  spiceLevel?: number;
};

function cleanDescription(desc: string | undefined): string | undefined {
  if (!desc?.trim()) return undefined;
  return sanitizeMenuDescriptionForDiner(desc) ?? undefined;
}

function mergeLocalePack(
  t: LocalePack,
  existing: MenuTranslationsMap,
): { merged: MenuTranslationsMap; added: boolean } {
  const from: Partial<Record<string, MenuLocaleFields>> = {};
  if (t.en) {
    const desc = cleanDescription(t.enDesc);
    from["en"] = { name: t.en, ...(desc ? { description: desc } : {}) };
  }
  if (t.ja) {
    const desc = cleanDescription(t.jaDesc);
    from["ja"] = { name: t.ja, ...(desc ? { description: desc } : {}) };
  }
  if (t.zhCN) {
    const desc = cleanDescription(t.zhCNDesc);
    from["zh-Hans"] = { name: t.zhCN, ...(desc ? { description: desc } : {}) };
  }
  if (t.zhTW) {
    const desc = cleanDescription(t.zhTWDesc);
    from["zh-Hant"] = { name: t.zhTW, ...(desc ? { description: desc } : {}) };
  }

  const merged: MenuTranslationsMap = { ...existing };
  let added = false;
  for (const [locale, fields] of Object.entries(from)) {
    if (!fields) continue;
    const key = locale as keyof MenuTranslationsMap;
    const prev = merged[key] ?? {};
    const next: MenuLocaleFields = { ...prev };
    let localeAdded = false;

    if (fields.name && !prev.name?.trim()) {
      next.name = fields.name;
      localeAdded = true;
    }
    if (fields.description && !prev.description?.trim()) {
      next.description = fields.description;
      localeAdded = true;
    }

    if (localeAdded) {
      merged[key] = next;
      added = true;
    }
  }
  return { merged, added };
}

export function mergeHansikTranslations(
  name: string,
  existing: MenuTranslationsMap,
): { merged: MenuTranslationsMap; matched: boolean } {
  const entry = lookupHansik(name);
  if (!entry) return { merged: existing, matched: false };

  const result = mergeLocalePack(
    {
      en: entry.en,
      enDesc: entry.enDesc,
      ja: entry.ja,
      jaDesc: entry.jaDesc,
      zhCN: entry.zhCN,
      zhCNDesc: entry.zhCNDesc,
      zhTW: entry.zhTW,
      zhTWDesc: entry.zhTWDesc,
    },
    existing,
  );
  return { merged: result.merged, matched: result.added };
}

export type TranslationSource = "none" | "hansik" | "gemini_cache" | "gemini_new";

/** 저장 직전 — 이미 DB에 있던 조리 팁 문장도 정리 */
function sanitizeTranslationsDescriptions(map: MenuTranslationsMap): MenuTranslationsMap {
  const merged: MenuTranslationsMap = { ...map };
  for (const loc of DESC_LOCALES) {
    const prev = merged[loc];
    if (!prev?.description?.trim()) continue;
    const clean = sanitizeMenuDescriptionForDiner(prev.description);
    if (clean === prev.description.trim()) continue;
    merged[loc] = clean ? { ...prev, description: clean } : { ...prev, description: undefined };
  }
  return merged;
}

/** 이름 또는 설명이 비어 있는 locale 가 있는지. */
function needsLocaleFill(merged: MenuTranslationsMap): boolean {
  return DESC_LOCALES.some(
    (loc) => !merged[loc]?.name?.trim() || !merged[loc]?.description?.trim(),
  );
}

/**
 * 번역 fallback (서버 액션 전용):
 * 1. 한식진흥원 DB → 2. Supabase 캐시 → 3. Gemini (800선 외·빈 필드·메타).
 * 한국어 설명은 점주 입력만 사용 — AI가 채우지 않음.
 */
export async function mergeTranslationsWithFallback(
  name: string,
  existing: MenuTranslationsMap,
  serviceClient: SupabaseClient,
  koDescription?: string | null,
  existingMeta?: MenuTranslationMeta | null,
): Promise<{
  merged: MenuTranslationsMap;
  source: TranslationSource;
  menuMeta: MenuTranslationMeta;
  aiWarning: string | null;
}> {
  let source: TranslationSource = "none";
  let merged = existing;
  let aiWarning: string | null = null;
  let menuMeta = mergeMenuTranslationMeta(existingMeta, null);

  const hansik = mergeHansikTranslations(name, existing);
  if (hansik.matched) {
    merged = hansik.merged;
    source = "hansik";
  } else {
    const cached = await readTranslationCache(serviceClient, name);
    if (cached) {
      const fromCache = mergeLocalePack(cached, merged);
      merged = fromCache.merged;
      if (fromCache.added) source = "gemini_cache";
    }
  }

  const shouldCallGemini = needsLocaleFill(merged) || needsMenuMetaFill(menuMeta);
  if (shouldCallGemini) {
    const descContext = koDescription?.trim() || undefined;
    const gemini = await translateMenuWithGemini(name, descContext);
    if (gemini) {
      await writeTranslationCache(serviceClient, name, gemini);
      const fromGemini = mergeLocalePack(gemini, merged);
      merged = fromGemini.merged;
      menuMeta = mergeMenuTranslationMeta(menuMeta, menuMetaFromGemini(gemini));
      if (source === "none" && fromGemini.added) source = "gemini_new";
      else if (source === "none" && needsMenuMetaFill(existingMeta) && !needsMenuMetaFill(menuMeta)) {
        source = "gemini_new";
      }
    } else {
      aiWarning = geminiTranslationFailureHint(isGeminiConfigured());
    }
  }

  merged = sanitizeTranslationsDescriptions(merged);

  return { merged, source, menuMeta, aiWarning };
}
