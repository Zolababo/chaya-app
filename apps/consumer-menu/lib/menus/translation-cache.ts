/**
 * 서버 전용 — Gemini 번역 결과 Supabase 캐시 read/write.
 * createServiceSupabase() 클라이언트를 인자로 받는다 (RLS 우회 필요).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeminiMenuTranslation } from "./gemini-translate";

/** ko_name 정규화: 공백 제거 + 소문자 (hansik-db.ts 와 동일 규칙) */
function normalizeKey(name: string): string {
  return name.trim().replace(/\s+/g, "").toLowerCase();
}

type CacheRow = {
  en_name: string | null;
  ja_name: string | null;
  zh_hans_name: string | null;
  zh_hant_name: string | null;
  en_desc: string | null;
  ja_desc: string | null;
  zh_hans_desc: string | null;
  zh_hant_desc: string | null;
};

function rowToGemini(row: CacheRow): GeminiMenuTranslation {
  return {
    en: row.en_name ?? undefined,
    ja: row.ja_name ?? undefined,
    zhCN: row.zh_hans_name ?? undefined,
    zhTW: row.zh_hant_name ?? undefined,
    enDesc: row.en_desc ?? undefined,
    jaDesc: row.ja_desc ?? undefined,
    zhCNDesc: row.zh_hans_desc ?? undefined,
    zhTWDesc: row.zh_hant_desc ?? undefined,
  };
}

/** 캐시 조회. 없으면 null. */
export async function readTranslationCache(
  client: SupabaseClient,
  name: string,
): Promise<GeminiMenuTranslation | null> {
  const { data } = await client
    .from("menu_translation_cache")
    .select(
      "en_name, ja_name, zh_hans_name, zh_hant_name, en_desc, ja_desc, zh_hans_desc, zh_hant_desc",
    )
    .eq("ko_name", normalizeKey(name))
    .maybeSingle();

  if (!data) return null;
  return rowToGemini(data as CacheRow);
}

/** Gemini 결과를 캐시에 upsert. 기존 값과 병합. 실패해도 예외 무시. */
export async function writeTranslationCache(
  client: SupabaseClient,
  name: string,
  t: GeminiMenuTranslation,
): Promise<void> {
  try {
    const existing = await readTranslationCache(client, name);
    const merged: GeminiMenuTranslation = {
      en: t.en ?? existing?.en,
      ja: t.ja ?? existing?.ja,
      zhCN: t.zhCN ?? existing?.zhCN,
      zhTW: t.zhTW ?? existing?.zhTW,
      enDesc: t.enDesc ?? existing?.enDesc,
      jaDesc: t.jaDesc ?? existing?.jaDesc,
      zhCNDesc: t.zhCNDesc ?? existing?.zhCNDesc,
      zhTWDesc: t.zhTWDesc ?? existing?.zhTWDesc,
    };

    await client.from("menu_translation_cache").upsert({
      ko_name: normalizeKey(name),
      en_name: merged.en ?? null,
      ja_name: merged.ja ?? null,
      zh_hans_name: merged.zhCN ?? null,
      zh_hant_name: merged.zhTW ?? null,
      en_desc: merged.enDesc ?? null,
      ja_desc: merged.jaDesc ?? null,
      zh_hans_desc: merged.zhCNDesc ?? null,
      zh_hant_desc: merged.zhTWDesc ?? null,
      source: "gemini",
      updated_at: new Date().toISOString(),
    });
  } catch {
    // 캐시 저장 실패는 무시 — 번역은 이미 메뉴에 적용됨
  }
}
