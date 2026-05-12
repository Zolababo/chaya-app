import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

import type { ChayaMenuRow } from "./types";

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

  return {
    id: String(id),
    name,
    description: typeof raw.description === "string" ? raw.description : null,
    price,
    category: typeof raw.category === "string" ? raw.category : null,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : null,
    sortOrder: sortOrderNorm,
    isSoldOut:
      raw.is_sold_out === true ||
      raw.is_sold_out === "true" ||
      raw.isSoldOut === true ||
      raw.isSoldOut === "true",
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

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("ChayaMenus")
      .select("id,name,description,price,category,imageUrl,sort_order,is_sold_out")
      .eq("tenant_slug", slug)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  );

  if (error) {
    return { ok: false, message: error.message ?? error.code ?? "메뉴를 불러오지 못했습니다." };
  }

  const items = (data ?? [])
    .map((r) => normalizeRow(r as Record<string, unknown>))
    .filter((row): row is ChayaMenuRow => row !== null);

  return { ok: true, items };
}
