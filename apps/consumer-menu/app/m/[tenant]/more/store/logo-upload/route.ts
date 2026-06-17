import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { canManageMerchantStoreProfile } from "@/lib/merchant/merchant-role-capabilities";
import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";
import { pickUploadedMenuImageUrl } from "@/lib/menus/upload-menu-image";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ tenant: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const { tenant } = await ctx.params;
  const auth = await requireMerchantLiveJsonAccess(tenant);
  if (auth instanceof NextResponse) return auth;
  if (!canManageMerchantStoreProfile(auth.role)) {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403, ...MERCHANT_LIVE_JSON_HEADERS });
  }

  const client = createServiceSupabase();
  if (!client) {
    return NextResponse.json({ ok: false, message: "no_service" }, { status: 503, ...MERCHANT_LIVE_JSON_HEADERS });
  }

  let raw: FormData;
  try {
    raw = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "사진을 받지 못했습니다." },
      { status: 400, ...MERCHANT_LIVE_JSON_HEADERS },
    );
  }

  const file = raw.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { ok: false, message: "사진 파일이 없습니다." },
      { status: 400, ...MERCHANT_LIVE_JSON_HEADERS },
    );
  }

  const uploaded = await pickUploadedMenuImageUrl(client, raw, auth.slug);
  if (!uploaded.ok) {
    return NextResponse.json(
      { ok: false, message: uploaded.message },
      { status: 400, ...MERCHANT_LIVE_JSON_HEADERS },
    );
  }
  if (!uploaded.url) {
    return NextResponse.json(
      { ok: false, message: "사진 파일이 없습니다." },
      { status: 400, ...MERCHANT_LIVE_JSON_HEADERS },
    );
  }

  const { error: dbErr } = await client.from("tenant_store_settings").upsert(
    {
      tenant_slug: auth.slug,
      logo_url: uploaded.url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_slug" },
  );

  if (dbErr) {
    console.error("[logo-upload] db", dbErr.code, dbErr.message);
    return NextResponse.json(
      { ok: false, message: "사진은 올렸지만 매장 설정에 저장하지 못했어요." },
      { status: 500, ...MERCHANT_LIVE_JSON_HEADERS },
    );
  }

  revalidatePath(`/m/${auth.slug}/more/store`);

  return NextResponse.json({ ok: true, url: uploaded.url }, MERCHANT_LIVE_JSON_HEADERS);
}
