import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { parseMenuTranslationsMap } from "@/lib/i18n/menu-translations";
import { parseMenuTranslationSource } from "@/lib/merchant/merchant-menu-translation-source";

import {
  CHAYA_MENU_SELECT_BASE,
  CHAYA_MENU_SELECT_FULL,
  CHAYA_MENU_SELECT_LEGACY_FULL,
  CHAYA_MENU_SELECT_MERCH_FULL,
  CHAYA_MENU_SELECT_WITH_OPTIONS,
  isMissingCreatedAtColumn,
  isMissingMerchandisingColumns,
  isMissingOptionsJsonColumn,
  isMissingTranslationsJsonColumn,
} from "./chaya-menus-select";
import { parseMenuCreatedAt } from "./menu-item-badges";
import { parseMenuTranslationMeta } from "./menu-translation-meta";
import { parseMenuMerchandisingFlags, parseMenuSoldOut } from "./parse-menu-row-flags";
import { parseMenuOptionGroups } from "./menu-options";
import { sortCategoryNames, sortMenuItemsForDisplay } from "./category-order";
import type { ChayaMenuRow, MenuListResult } from "./types";

export { sortCategoryNames, sortMenuItemsForDisplay } from "./category-order";

const MENU_SELECT_BASE = CHAYA_MENU_SELECT_BASE;
const MENU_SELECT_WITH_OPTIONS = CHAYA_MENU_SELECT_WITH_OPTIONS;
const MENU_SELECT_FULL = CHAYA_MENU_SELECT_FULL;

const DEMO_ITEMS: ChayaMenuRow[] = [
  {
    id: "demo-bibimbap",
    name: "Classic Bibimbap",
    description: "Steamed rice with seasonal vegetables and spicy gochujang.",
    price: 12000,
    category: "Korean Food",
    imageUrl: null,
    sortOrder: 0,
    isSoldOut: false,
    isTodaysPick: false,
    isStoreRecommended: false,
    createdAt: null,
    optionGroups: [],
    translations: {},
    translationSource: null,
    spiceLevel: null,
  },
];

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

  const { isTodaysPick, isStoreRecommended } = parseMenuMerchandisingFlags(raw);
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
    isTodaysPick,
    isStoreRecommended,
    createdAt: parseMenuCreatedAt(raw),
    optionGroups: parseMenuOptionGroups(raw.options_json),
    translations: parseMenuTranslationsMap(raw.translations_json),
    translationSource: parseMenuTranslationSource(raw.translations_json),
    spiceLevel: translationMeta?.spiceLevel ?? null,
  };
}

type MenuQueryClient = NonNullable<ReturnType<typeof createConsumerSupabase>>;

async function queryMenusForTenant(
  client: MenuQueryClient,
  slug: string,
  select: string,
) {
  return withSupabaseReadRetry(() =>
    client
      .from("ChayaMenus")
      .select(select)
      .eq("tenant_slug", slug)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  );
}

/** 목록 조회. DB 컬럼 `tenant_slug` 가 URL 세그먼트 `tenant` 와 일치하는 행만 반환합니다. */
async function listMenusForTenantUncached(slug: string): Promise<MenuListResult> {
  const client = createConsumerSupabase();
  if (!client) {
    return { ok: true, source: "demo", items: DEMO_ITEMS };
  }

  let { data, error } = await queryMenusForTenant(client, slug, MENU_SELECT_FULL);

  if (error && isMissingTranslationsJsonColumn(error)) {
    const withoutTr = await queryMenusForTenant(client, slug, MENU_SELECT_WITH_OPTIONS);
    data = withoutTr.data;
    error = withoutTr.error;
  }

  if (error && isMissingOptionsJsonColumn(error)) {
    const fallback = await queryMenusForTenant(client, slug, MENU_SELECT_BASE);
    data = fallback.data;
    error = fallback.error;
  }

  if (error && isMissingMerchandisingColumns(error)) {
    const legacy = await queryMenusForTenant(client, slug, CHAYA_MENU_SELECT_LEGACY_FULL);
    data = legacy.data;
    error = legacy.error;
  }

  if (error && isMissingCreatedAtColumn(error)) {
    const noCreated = await queryMenusForTenant(client, slug, CHAYA_MENU_SELECT_MERCH_FULL);
    data = noCreated.data;
    error = noCreated.error;
  }

  if (error) {
    return {
      ok: false,
      source: "supabase",
      items: DEMO_ITEMS,
      notice:
        "메뉴를 불러오지 못해 데모 목록을 표시합니다. Supabase 연결·`tenant_slug` 마이그레이션·RLS(anon SELECT)를 확인해 주세요.",
    };
  }

  const rows = (data ?? []) as unknown[];
  const items = rows
    .map((row) =>
      row && typeof row === "object"
        ? normalizeRow(row as Record<string, unknown>)
        : null,
    )
    .filter((row): row is ChayaMenuRow => row !== null);

  if (items.length === 0) {
    return {
      ok: true,
      source: "supabase",
      items: [],
      notice: `이 가게(${slug})에 등록된 메뉴가 없습니다. 점주 메뉴 관리(/m/${slug}/menus)에서 추가했는지, Supabase ChayaMenus.tenant_slug 가 URL과 같은지 확인해 주세요.`,
    };
  }

  return { ok: true, source: "supabase", items };
}

export const listMenusForTenant = cache(async function listMenusForTenant(
  tenant: string,
): Promise<MenuListResult> {
  const slug = tenant.trim();
  if (!slug) {
    return {
      ok: true,
      source: "demo",
      items: [],
      notice: "유효한 테넌트 경로가 아닙니다.",
    };
  }

  return unstable_cache(
    () => listMenusForTenantUncached(slug),
    ["chaya-consumer-menus", slug],
    { revalidate: 30, tags: [`chaya-menus-${slug}`] },
  )();
});

export async function getMenuById(tenant: string, itemId: string): Promise<ChayaMenuRow | null> {
  const slug = tenant.trim();

  if (itemId === "sample") {
    const list = await listMenusForTenant(tenant);
    return list.items[0] ?? null;
  }

  const client = createConsumerSupabase();
  if (!client) {
    return DEMO_ITEMS.find((r) => r.id === itemId) ?? null;
  }

  if (!slug) return null;

  const primary = await withSupabaseReadRetry(() =>
    client
      .from("ChayaMenus")
      .select(MENU_SELECT_FULL)
      .eq("id", itemId)
      .eq("tenant_slug", slug)
      .maybeSingle(),
  );

  let row: unknown = primary.data;
  let error = primary.error;

  if (error && isMissingTranslationsJsonColumn(error)) {
    const withoutTr = await withSupabaseReadRetry(() =>
      client
        .from("ChayaMenus")
        .select(MENU_SELECT_WITH_OPTIONS)
        .eq("id", itemId)
        .eq("tenant_slug", slug)
        .maybeSingle(),
    );
    row = withoutTr.data;
    error = withoutTr.error;
  }

  if (error && isMissingOptionsJsonColumn(error)) {
    const fallback = await withSupabaseReadRetry(() =>
      client
        .from("ChayaMenus")
        .select(MENU_SELECT_BASE)
        .eq("id", itemId)
        .eq("tenant_slug", slug)
        .maybeSingle(),
    );
    row = fallback.data;
    error = fallback.error;
  }

  if (error && isMissingMerchandisingColumns(error)) {
    const legacy = await withSupabaseReadRetry(() =>
      client
        .from("ChayaMenus")
        .select(CHAYA_MENU_SELECT_LEGACY_FULL)
        .eq("id", itemId)
        .eq("tenant_slug", slug)
        .maybeSingle(),
    );
    row = legacy.data;
    error = legacy.error;
  }

  if (error && isMissingCreatedAtColumn(error)) {
    const noCreated = await withSupabaseReadRetry(() =>
      client
        .from("ChayaMenus")
        .select(CHAYA_MENU_SELECT_MERCH_FULL)
        .eq("id", itemId)
        .eq("tenant_slug", slug)
        .maybeSingle(),
    );
    row = noCreated.data;
    error = noCreated.error;
  }

  if (error) {
    return DEMO_ITEMS.find((r) => r.id === itemId) ?? null;
  }

  if (!row || typeof row !== "object") return null;

  return normalizeRow(row as Record<string, unknown>);
}

export function collectCategories(items: ChayaMenuRow[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    set.add(item.category?.trim() || "기타");
  }
  return sortCategoryNames([...set]);
}

export function formatKrw(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}
