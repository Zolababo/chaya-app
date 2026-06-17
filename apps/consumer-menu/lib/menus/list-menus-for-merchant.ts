import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

import { parseMenuTranslationsMap } from "@/lib/i18n/menu-translations";
import { parseMenuTranslationSource } from "@/lib/merchant/merchant-menu-translation-source";

import {
  CHAYA_MENU_SELECT_BASE,
  CHAYA_MENU_SELECT_FULL,
  CHAYA_MENU_SELECT_HOME,
  CHAYA_MENU_SELECT_LEGACY_BASE,
  CHAYA_MENU_SELECT_LEGACY_FULL,
  CHAYA_MENU_SELECT_LEGACY_HOME,
  CHAYA_MENU_SELECT_MERCH,
  CHAYA_MENU_SELECT_WITH_OPTIONS,
  isMissingMerchandisingColumns,
  isMissingOptionsJsonColumn,
  isMissingTranslationsJsonColumn,
} from "./chaya-menus-select";
import { parseMenuCreatedAt } from "./menu-item-badges";
import { parseMenuTranslationMeta } from "./menu-translation-meta";
import { parseMenuMerchandisingFlags, parseMenuSoldOut } from "./parse-menu-row-flags";
import { parseMenuOptionGroups, stringifyMenuOptionGroups } from "./menu-options";
import type { ChayaMenuRow } from "./types";

export { stringifyMenuOptionGroups };

export type ListMerchantMenusResult =
  | { ok: true; items: ChayaMenuRow[] }
  | { ok: false; message: string };

function normalizeRow(raw: Record<string, unknown>): ChayaMenuRow | null {
  const id = raw.id;
  const name = raw.name;
  if (id == null || name == null || typeof name !== "string") return null;
  const priceRaw = raw.price;
  const price =
    typeof priceRaw === "number"
      ? priceRaw
      : typeof priceRaw === "string"
        ? Number(priceRaw)
        : NaN;
  if (!Number.isFinite(price)) return null;

  const sortRaw = raw.sort_order ?? raw.sortOrder;
  const sortOrder =
    typeof sortRaw === "number"
      ? sortRaw
      : typeof sortRaw === "string"
        ? Number(sortRaw)
        : 0;
  const sortOrderNorm = Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0;
  const translationMeta = parseMenuTranslationMeta(raw.translations_json);

  return {
    id: String(id),
    name,
    description: typeof raw.description === "string" ? raw.description : null,
    price,
    category: typeof raw.category === "string" ? raw.category : null,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : null,
    sortOrder: sortOrderNorm,
    isSoldOut: parseMenuSoldOut(raw),
    ...parseMenuMerchandisingFlags(raw),
    createdAt: parseMenuCreatedAt(raw),
    optionGroups: parseMenuOptionGroups(raw.options_json),
    translations: parseMenuTranslationsMap(raw.translations_json),
    translationSource: parseMenuTranslationSource(raw.translations_json),
    spiceLevel: translationMeta?.spiceLevel ?? null,
  };
}

export async function listMenusForMerchant(tenantSlug: string): Promise<ListMerchantMenusResult> {
  const slug = tenantSlug.trim();
  if (!slug) {
    return { ok: false, message: "테넌트가 없습니다." };
  }

  const client = createServiceSupabase();
  if (!client) {
    return {
      ok: false,
      message:
        "Supabase 서버 접속 설정이 없습니다. Vercel Production에 SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_SECRET_KEY)와 NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_URL 을 넣고 재배포해 주세요.",
    };
  }

  let { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("ChayaMenus")
      .select(CHAYA_MENU_SELECT_MERCH)
      .eq("tenant_slug", slug)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  );

  if (error && isMissingMerchandisingColumns(error)) {
    const legacy = await withSupabaseReadRetry(() =>
      client
        .from("ChayaMenus")
        .select(CHAYA_MENU_SELECT_LEGACY_BASE)
        .eq("tenant_slug", slug)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    );
    data = legacy.data as typeof data;
    error = legacy.error;
  }

  if (error) {
    return { ok: false, message: error.message ?? error.code ?? "메뉴를 불러오지 못했습니다." };
  }

  const items = (data ?? [])
    .map((r) => normalizeRow(r as Record<string, unknown>))
    .filter((row): row is ChayaMenuRow => row !== null);

  return { ok: true, items };
}

/** 점주 홈 — 메뉴 현황 카드용 경량 목록 (description·이미지·옵션 제외) */
export async function listMenusForMerchantHomeSummary(
  tenantSlug: string,
): Promise<ListMerchantMenusResult> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "테넌트가 없습니다." };

  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "서버 설정이 없어 메뉴를 불러올 수 없습니다." };
  }

  let { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("ChayaMenus")
      .select(CHAYA_MENU_SELECT_HOME)
      .eq("tenant_slug", slug)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  );

  if (error && isMissingMerchandisingColumns(error)) {
    const legacy = await withSupabaseReadRetry(() =>
      client
        .from("ChayaMenus")
        .select(CHAYA_MENU_SELECT_LEGACY_HOME)
        .eq("tenant_slug", slug)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    );
    data = legacy.data as typeof data;
    error = legacy.error;
  }

  if (error) {
    return { ok: false, message: error.message ?? error.code ?? "메뉴를 불러오지 못했습니다." };
  }

  const items = (data ?? [])
    .map((r) => normalizeRow(r as Record<string, unknown>))
    .filter((row): row is ChayaMenuRow => row !== null);

  return { ok: true, items };
}

/** 점주 메뉴 상세 편집 화면용 단건 조회. */
export async function getMenuForMerchant(
  tenantSlug: string,
  menuId: string,
): Promise<{ ok: true; item: ChayaMenuRow } | { ok: false; message: string }> {
  const slug = tenantSlug.trim();
  const id = menuId.trim();
  if (!slug || !id) {
    return { ok: false, message: "메뉴를 찾을 수 없습니다." };
  }

  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "서버 설정이 없어 메뉴를 불러올 수 없습니다." };
  }

  async function fetchRow(select: string) {
    return client!
      .from("ChayaMenus")
      .select(select)
      .eq("tenant_slug", slug)
      .eq("id", id)
      .maybeSingle();
  }

  let { data, error } = await withSupabaseReadRetry(() => fetchRow(CHAYA_MENU_SELECT_FULL));

  if (error && isMissingTranslationsJsonColumn(error)) {
    const r = await withSupabaseReadRetry(() => fetchRow(CHAYA_MENU_SELECT_WITH_OPTIONS));
    data = r.data as typeof data;
    error = r.error;
  }
  if (error && isMissingOptionsJsonColumn(error)) {
    const r = await withSupabaseReadRetry(() => fetchRow(CHAYA_MENU_SELECT_BASE));
    data = r.data as typeof data;
    error = r.error;
  }
  if (error && isMissingMerchandisingColumns(error)) {
    const r = await withSupabaseReadRetry(() => fetchRow(CHAYA_MENU_SELECT_LEGACY_FULL));
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    return { ok: false, message: error.message ?? "메뉴를 불러오지 못했습니다." };
  }
  if (!data) {
    return { ok: false, message: "메뉴를 찾을 수 없습니다." };
  }

  const item = normalizeRow(data as unknown as Record<string, unknown>);
  if (!item) {
    return { ok: false, message: "메뉴 데이터 형식이 올바르지 않습니다." };
  }

  return { ok: true, item };
}
