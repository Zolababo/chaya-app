import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { canManageMerchantMenus } from "@/lib/merchant/merchant-role-capabilities";
import {
  MERCHANT_LIVE_JSON_HEADERS,
  requireMerchantLiveJsonAccess,
} from "@/lib/merchant/merchant-live-api-auth";
import { recordMerchantAuditEvent } from "@/lib/merchant/record-merchant-audit";
import { tryRemoveMenuImageForTenant } from "@/lib/menus/remove-menu-image-from-url";
import { pickUploadedMenuImageUrl } from "@/lib/menus/upload-menu-image";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { resolveServerUserForLiveApi } from "@/lib/supabase/resolve-server-user";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ tenant: string; menuId: string }> };

/** 메뉴 사진 — Storage + imageUrl (Server Action 대체) */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { tenant, menuId } = await ctx.params;
  const auth = await requireMerchantLiveJsonAccess(tenant);
  if (auth instanceof NextResponse) return auth;
  if (!canManageMerchantMenus(auth.role)) {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403, ...MERCHANT_LIVE_JSON_HEADERS });
  }

  const id = menuId.trim();
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, message: "bad_menu" }, { status: 400, ...MERCHANT_LIVE_JSON_HEADERS });
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

  const { data: existing } = await client
    .from("ChayaMenus")
    .select("imageUrl")
    .eq("id", id)
    .eq("tenant_slug", auth.slug)
    .maybeSingle();

  const prevUrl =
    existing && typeof existing === "object" && "imageUrl" in existing
      ? (existing as { imageUrl?: string | null }).imageUrl
      : null;

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

  const { error } = await client
    .from("ChayaMenus")
    .update({ imageUrl: uploaded.url })
    .eq("id", id)
    .eq("tenant_slug", auth.slug);

  if (error) {
    console.error("[menu-image-upload] db", error.code, error.message);
    return NextResponse.json(
      { ok: false, message: "사진은 올렸지만 메뉴에 저장하지 못했어요." },
      { status: 500, ...MERCHANT_LIVE_JSON_HEADERS },
    );
  }

  if (prevUrl && prevUrl !== uploaded.url) {
    await tryRemoveMenuImageForTenant(client, auth.slug, prevUrl);
  }

  const supabase = await createSupabaseServerClient();
  const user = supabase ? await resolveServerUserForLiveApi(supabase) : null;
  if (user) {
    void recordMerchantAuditEvent({
      tenantSlug: auth.slug,
      actorUserId: user.id,
      action: "menu_image_upload",
      detail: { menu_id: id },
    });
  }

  revalidatePath(`/m/${auth.slug}/menus/${id}`);

  return NextResponse.json({ ok: true, url: uploaded.url }, MERCHANT_LIVE_JSON_HEADERS);
}
