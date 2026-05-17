import type { SupabaseClient } from "@supabase/supabase-js";

import { folderSafeTenant } from "./storage-tenant-folder";

/** Next serverActions bodySizeLimit(6mb) 이하로 유지 */
export const MENU_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

function extFromFileName(name: string): string | null {
  const lower = name.trim().toLowerCase();
  const m = lower.match(/\.([a-z0-9]+)$/);
  if (!m) return null;
  const ext = m[1];
  if (["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return null;
}

function resolveMenuImageType(file: File): { ext: string; contentType: string } | null {
  const fromMime = MIME_TO_EXT[file.type];
  if (fromMime) {
    return { ext: fromMime, contentType: file.type };
  }
  const fromName = extFromFileName(file.name);
  if (fromName) {
    const contentType =
      fromName === "jpg"
        ? "image/jpeg"
        : fromName === "heic" || fromName === "heif"
          ? `image/${fromName}`
          : `image/${fromName}`;
    return { ext: fromName, contentType };
  }
  return null;
}

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

  if (file.size > MENU_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      message: `이미지는 ${Math.round(MENU_IMAGE_MAX_BYTES / (1024 * 1024))}MB 이하여야 합니다. 폰 설정에서 사진 품질을 낮추거나 다른 사진을 선택해 주세요.`,
    };
  }

  const resolved = resolveMenuImageType(file);
  if (!resolved) {
    return {
      ok: false,
      message:
        "지원하지 않는 형식입니다. JPEG·PNG·WebP·GIF·HEIC(아이폰) 또는 파일명에 .jpg/.png 등이 있어야 합니다.",
    };
  }

  const bucket = process.env.SUPABASE_MENU_IMAGES_BUCKET?.trim() || "menu-images";
  const folder = folderSafeTenant(tenantSlug);
  const objectPath = `${folder}/${crypto.randomUUID()}.${resolved.ext}`;

  const body = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await client.storage.from(bucket).upload(objectPath, body, {
    contentType: resolved.contentType,
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
