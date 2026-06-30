import type { SupabaseClient } from "@supabase/supabase-js";

import {
  MERCHANT_IMAGE_MAX_BYTES,
  validateMerchantImageUpload,
} from "@/lib/merchant/merchant-image-upload-policy";
import { normalizeUploadImageBuffer } from "./normalize-upload-image-buffer";
import { folderSafeTenant } from "./storage-tenant-folder";

/** JPEG·PNG · 3MB (Vercel 4.5MB 여유) */
export const MENU_IMAGE_MAX_BYTES = MERCHANT_IMAGE_MAX_BYTES;

async function uploadToMenuBucket(
  client: SupabaseClient,
  tenantSlug: string,
  body: Buffer,
  contentType: string,
  ext: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const bucket = process.env.SUPABASE_MENU_IMAGES_BUCKET?.trim() || "menu-images";
  const folder = folderSafeTenant(tenantSlug);
  const objectPath = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await client.storage.from(bucket).upload(objectPath, body, {
    contentType,
    upsert: false,
    cacheControl: "3600",
  });

  if (upErr) {
    const msg = upErr.message ?? "업로드 실패";
    if (/bucket/i.test(msg)) {
      return {
        ok: false,
        message: `Storage 버킷「${bucket}」을 확인해 주세요. Supabase 대시보드 → Storage.`,
      };
    }
    return { ok: false, message: msg };
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl?.trim();
  if (!publicUrl) {
    return { ok: false, message: "공개 URL 을 만들지 못했습니다." };
  }

  return { ok: true, url: publicUrl };
}

/**
 * FormData 의 `file` 필드가 있으면 Storage 에 올리고 공개 URL 을 돌려줍니다.
 * JPEG·PNG · 3MB 이하만 허용합니다.
 */
export async function pickUploadedMenuImageUrl(
  client: SupabaseClient,
  formData: FormData,
  tenantSlug: string,
): Promise<{ ok: true; url: string | null } | { ok: false; message: string }> {
  const raw = formData.get("file");
  if (raw == null || typeof raw === "string") {
    return { ok: true, url: null };
  }

  const file = raw as File;
  if (file.size === 0) {
    return { ok: true, url: null };
  }

  const body = new Uint8Array(await file.arrayBuffer());
  const checked = validateMerchantImageUpload(file, body);
  if (!checked.ok) {
    return { ok: false, message: checked.message };
  }

  const rawBuffer = Buffer.from(body);
  const normalized = await normalizeUploadImageBuffer(rawBuffer);
  if (normalized) {
    const uploaded = await uploadToMenuBucket(
      client,
      tenantSlug,
      normalized.body,
      normalized.contentType,
      normalized.ext,
    );
    if (!uploaded.ok) return uploaded;
    return { ok: true, url: uploaded.url };
  }

  const uploaded = await uploadToMenuBucket(
    client,
    tenantSlug,
    rawBuffer,
    checked.contentType,
    checked.ext === "jpeg" ? "jpg" : "png",
  );
  if (!uploaded.ok) return uploaded;
  return { ok: true, url: uploaded.url };
}
