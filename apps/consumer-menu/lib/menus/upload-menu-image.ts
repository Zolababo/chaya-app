import type { SupabaseClient } from "@supabase/supabase-js";

import { folderSafeTenant } from "./storage-tenant-folder";

const MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * FormData 의 `file` 필드가 있으면 Storage 에 올리고 공개 URL 을 돌려줍니다.
 * 파일이 없거나 비어 있으면 `{ ok: true, url: null }` 입니다.
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

  if (file.size > MAX_BYTES) {
    return { ok: false, message: "이미지는 5MB 이하여야 합니다." };
  }

  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    return { ok: false, message: "JPEG, PNG, WebP, GIF 만 업로드할 수 있습니다." };
  }

  const bucket = process.env.SUPABASE_MENU_IMAGES_BUCKET?.trim() || "menu-images";
  const folder = folderSafeTenant(tenantSlug);
  const objectPath = `${folder}/${crypto.randomUUID()}.${ext}`;

  const body = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await client.storage.from(bucket).upload(objectPath, body, {
    contentType: file.type,
    upsert: false,
    cacheControl: "3600",
  });

  if (upErr) {
    return { ok: false, message: upErr.message };
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl?.trim();
  if (!publicUrl) {
    return { ok: false, message: "공개 URL 을 만들지 못했습니다." };
  }

  return { ok: true, url: publicUrl };
}
