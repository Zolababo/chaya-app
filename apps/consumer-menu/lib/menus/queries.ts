import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

import type { ChayaMenuRow, MenuListResult } from "./types";

const DEMO_ITEMS: ChayaMenuRow[] = [
  {
    id: "demo-bibimbap",
    name: "Classic Bibimbap",
    description: "Steamed rice with seasonal vegetables and spicy gochujang.",
    price: 12000,
    category: "Korean Food",
    imageUrl: null,
    sortOrder: 0,
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

  return {
    id: String(id),
    name,
    description: typeof raw.description === "string" ? raw.description : null,
    price,
    category: typeof raw.category === "string" ? raw.category : null,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : null,
    sortOrder: sortOrderNorm,
  };
}

/** 목록 조회. DB 컬럼 `tenant_slug` 가 URL 세그먼트 `tenant` 와 일치하는 행만 반환합니다. */
export async function listMenusForTenant(tenant: string): Promise<MenuListResult> {
  const slug = tenant.trim();
  if (!slug) {
    return {
      ok: true,
      source: "demo",
      items: [],
      notice: "유효한 테넌트 경로가 아닙니다.",
    };
  }

  const client = createConsumerSupabase();
  if (!client) {
    return { ok: true, source: "demo", items: DEMO_ITEMS };
  }

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("ChayaMenus")
      .select("id,name,description,price,category,imageUrl,sort_order")
      .eq("tenant_slug", slug)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  );

  if (error) {
    return {
      ok: false,
      source: "supabase",
      items: DEMO_ITEMS,
      notice:
        "메뉴를 불러오지 못해 데모 목록을 표시합니다. Supabase 연결·`tenant_slug` 마이그레이션·RLS(anon SELECT)를 확인해 주세요.",
    };
  }

  const items = (data ?? [])
    .map((row) => normalizeRow(row as Record<string, unknown>))
    .filter((row): row is ChayaMenuRow => row !== null);

  if (items.length === 0) {
    return {
      ok: true,
      source: "supabase",
      items: [],
      notice: `이 가게(${slug})에 등록된 메뉴가 없습니다. Supabase에서 해당 행의 tenant_slug를 확인해 주세요.`,
    };
  }

  return { ok: true, source: "supabase", items };
}

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

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("ChayaMenus")
      .select("id,name,description,price,category,imageUrl,sort_order")
      .eq("id", itemId)
      .eq("tenant_slug", slug)
      .maybeSingle(),
  );

  if (error) {
    return DEMO_ITEMS.find((r) => r.id === itemId) ?? null;
  }

  if (!data) return null;

  return normalizeRow(data as Record<string, unknown>);
}

export function collectCategories(items: ChayaMenuRow[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    set.add(item.category?.trim() || "기타");
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ko"));
}

export function formatKrw(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}
