import type { SupabaseClient } from "@supabase/supabase-js";

import { convertHeicBufferToJpeg } from "./convert-heic-buffer";
import { normalizeUploadImageBuffer } from "./normalize-upload-image-buffer";
import { folderSafeTenant } from "./storage-tenant-folder";

/** Next serverActions bodySizeLimit(6mb) 이하로 유지 */
export const MENU_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/x-png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/heic-sequence": "heic",
  "image/heif-sequence": "heif",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/x-ms-bmp": "bmp",
  "image/tiff": "tiff",
  "image/x-tiff": "tiff",
  "image/jfif": "jfif",
  "image/x-citrix-jpeg": "jpg",
  "image/x-citrix-png": "png",
};

function extFromFileName(name: string): string | null {
  const lower = name.trim().toLowerCase();
  const m = lower.match(/\.([a-z0-9]+)$/);
  if (!m) return null;
  const ext = m[1];
  if (["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif", "bmp", "tif", "tiff", "jfif"].includes(ext)) {
    if (ext === "jpeg") return "jpg";
    if (ext === "tif") return "tiff";
    return ext;
  }
  return null;
}

function detectImageFromBytes(buf: Uint8Array): { ext: string; contentType: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", contentType: "image/jpeg" };
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return { ext: "png", contentType: "image/png" };
  }
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return { ext: "webp", contentType: "image/webp" };
  }
  if (buf.length >= 12 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = String.fromCharCode(buf[8]!, buf[9]!, buf[10]!, buf[11]!).toLowerCase();
    if (brand.startsWith("heic") || brand.startsWith("heix") || brand.startsWith("hevc")) {
      return { ext: "heic", contentType: "image/heic" };
    }
    if (brand.startsWith("mif1") || brand.startsWith("msf1") || brand.startsWith("heif")) {
      return { ext: "heif", contentType: "image/heif" };
    }
  }
  if (buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d) {
    return { ext: "bmp", contentType: "image/bmp" };
  }
  return null;
}

function resolveMenuImageType(
  file: File,
  buf: Uint8Array,
): { ext: string; contentType: string } | null {
  const mime = file.type.trim().toLowerCase();
  const fromMime = MIME_TO_EXT[mime];
  if (fromMime) {
    const ext = fromMime === "jfif" ? "jpg" : fromMime;
    return { ext, contentType: ext === "jpg" ? "image/jpeg" : mime || `image/${ext}` };
  }
  if (mime === "application/octet-stream" || mime.startsWith("image/")) {
    const sniff = detectImageFromBytes(buf);
    if (sniff) return sniff;
  }
  const fromName = extFromFileName(file.name);
  if (fromName) {
    const ext = fromName === "jfif" ? "jpg" : fromName;
    const contentType =
      ext === "jpg"
        ? "image/jpeg"
        : ext === "tiff"
          ? "image/tiff"
          : `image/${ext}`;
    return { ext, contentType };
  }
  return detectImageFromBytes(buf);
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

  const body = new Uint8Array(await file.arrayBuffer());
  const rawBuffer = Buffer.from(body);

  const normalized = await normalizeUploadImageBuffer(rawBuffer);
  if (normalized) {
    const bucket = process.env.SUPABASE_MENU_IMAGES_BUCKET?.trim() || "menu-images";
    const folder = folderSafeTenant(tenantSlug);
    const objectPath = `${folder}/${crypto.randomUUID()}.${normalized.ext}`;

    const { error: upErr } = await client.storage.from(bucket).upload(objectPath, normalized.body, {
      contentType: normalized.contentType,
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

  let resolved = resolveMenuImageType(file, body);
  if (resolved?.ext === "heic" || resolved?.ext === "heif") {
    const jpeg = detectImageFromBytes(body);
    if (jpeg?.ext === "jpg") resolved = jpeg;
  }
  if (!resolved) {
    return {
      ok: false,
      message:
        "지원하지 않는 형식입니다. 갤러리·카메라에서 사진을 다시 선택해 주세요.",
    };
  }

  if (resolved.ext === "heic" || resolved.ext === "heif") {
    const heicJpeg = await convertHeicBufferToJpeg(rawBuffer);
    if (heicJpeg) {
      const retry = await normalizeUploadImageBuffer(heicJpeg);
      if (retry) {
        const bucket = process.env.SUPABASE_MENU_IMAGES_BUCKET?.trim() || "menu-images";
        const folder = folderSafeTenant(tenantSlug);
        const objectPath = `${folder}/${crypto.randomUUID()}.${retry.ext}`;

        const { error: upErr } = await client.storage.from(bucket).upload(objectPath, retry.body, {
          contentType: retry.contentType,
          upsert: false,
          cacheControl: "3600",
        });

        if (!upErr) {
          const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
          const publicUrl = data?.publicUrl?.trim();
          if (publicUrl) return { ok: true, url: publicUrl };
        }
      }
    }

    return {
      ok: false,
      message:
        "HEIC 사진을 JPEG로 바꾸지 못했어요. 갤러리에서 같은 사진을 다시 선택해 주세요.",
    };
  }

  const bucket = process.env.SUPABASE_MENU_IMAGES_BUCKET?.trim() || "menu-images";
  const folder = folderSafeTenant(tenantSlug);
  const objectPath = `${folder}/${crypto.randomUUID()}.${resolved.ext}`;

  const { error: upErr } = await client.storage.from(bucket).upload(objectPath, body, {
    contentType: resolved.contentType,
    upsert: false,
    cacheControl: "3600",
  });

  if (upErr) {
    const msg = upErr.message ?? "업로드 실패";
    if (/heic|heif/i.test(msg)) {
      return {
        ok: false,
        message:
          "아이폰 사진 형식(HEIC)은 저장소에서 지원하지 않아요. 사진을 다시 선택하면 JPEG로 바뀝니다.",
      };
    }
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
