import { NextResponse, type NextRequest } from "next/server";

import { canManageMerchantMenus } from "@/lib/merchant/merchant-role-capabilities";
import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";
import { pickUploadedMenuImageUrl } from "@/lib/menus/upload-menu-image";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ tenant: string }> };

/** 메뉴 추가 폼 — Storage 업로드만 (Route Handler, Server Action 용량 회피) */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { tenant } = await ctx.params;
  const auth = await requireMerchantLiveJsonAccess(tenant);
  if (auth instanceof NextResponse) return auth;
  if (!canManageMerchantMenus(auth.role)) {
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

  return NextResponse.json({ ok: true, url: uploaded.url }, MERCHANT_LIVE_JSON_HEADERS);
}
