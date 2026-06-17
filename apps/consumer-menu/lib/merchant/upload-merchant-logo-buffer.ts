import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeUploadImageBuffer } from "@/lib/menus/normalize-upload-image-buffer";
import { folderSafeTenant } from "@/lib/menus/storage-tenant-folder";

const MAX_RAW_BYTES = 8 * 1024 * 1024;

export async function uploadMerchantLogoBuffer(
  client: SupabaseClient,
  tenantSlug: string,
  raw: Buffer,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (raw.length === 0) {
    return { ok: false, message: "빈 파일입니다." };
  }
  if (raw.length > MAX_RAW_BYTES) {
    return {
      ok: false,
      message: "사진이 너무 커요. 카메라 품질을 낮추거나 가까이서 다시 촬영해 주세요.",
    };
  }

  const normalized = await normalizeUploadImageBuffer(raw);
  if (!normalized) {
    return {
      ok: false,
      message: "사진을 JPEG로 바꾸지 못했어요. 갤러리에서 같은 사진을 다시 선택해 주세요.",
    };
  }

  const bucket = process.env.SUPABASE_MENU_IMAGES_BUCKET?.trim() || "menu-images";
  const folder = folderSafeTenant(tenantSlug);
  const objectPath = `${folder}/${crypto.randomUUID()}.${normalized.ext}`;

  const { error: upErr } = await client.storage.from(bucket).upload(objectPath, normalized.body, {
    contentType: normalized.contentType,
    upsert: false,
    cacheControl: "3600",
  });

  if (upErr) {
    return { ok: false, message: upErr.message ?? "업로드 실패" };
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl?.trim();
  if (!publicUrl) {
    return { ok: false, message: "공개 URL을 만들지 못했습니다." };
  }

  return { ok: true, url: publicUrl };
}
