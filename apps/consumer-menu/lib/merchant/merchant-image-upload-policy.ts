import {
  sniffImageFileKind,
  sniffImageKindFromBytes,
  type SniffedImageKind,
} from "@/lib/merchant/sniff-image-file-kind";

/** Vercel 본문 상한(≈4.5MB) 여유 — 점주 안내·검증은 3MB */
export const MERCHANT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const MERCHANT_IMAGE_MAX_MB = 3;

export const MERCHANT_IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png";

export const MERCHANT_IMAGE_UPLOAD_HINT = "JPEG·PNG만 · 3MB 이하";

type AllowedKind = "jpeg" | "png";

function isAllowedKind(kind: SniffedImageKind): kind is AllowedKind {
  return kind === "jpeg" || kind === "png";
}

export function merchantImageTooLargeMessage(): string {
  return `사진 용량은 ${MERCHANT_IMAGE_MAX_MB}MB 이하여야 합니다. 다른 사진을 선택해 주세요.`;
}

export function merchantImageUnsupportedMessage(kind?: SniffedImageKind): string {
  if (kind === "heic" || kind === "heif") {
    return "HEIC 사진은 올릴 수 없어요. 갤러리에서 JPEG로 저장하거나, 카메라 ‘고효율 사진’을 끈 뒤 다시 선택해 주세요.";
  }
  return "JPEG·PNG만 올릴 수 있어요.";
}

/** 클라이언트 — 파일 선택 직후 검증 */
export async function validateMerchantImageFile(
  file: File,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (file.size === 0) {
    return { ok: false, message: "빈 파일입니다. 다른 사진을 선택해 주세요." };
  }
  if (file.size > MERCHANT_IMAGE_MAX_BYTES) {
    return { ok: false, message: merchantImageTooLargeMessage() };
  }

  const kind = await sniffImageFileKind(file);
  if (!isAllowedKind(kind)) {
    return { ok: false, message: merchantImageUnsupportedMessage(kind) };
  }

  return { ok: true };
}

/** 서버 — 바이트·메타데이터 검증 */
export function validateMerchantImageUpload(
  file: File,
  body: Uint8Array,
): { ok: true; ext: AllowedKind; contentType: string } | { ok: false; message: string } {
  if (file.size === 0) {
    return { ok: false, message: "사진 파일이 없습니다." };
  }
  if (file.size > MERCHANT_IMAGE_MAX_BYTES) {
    return { ok: false, message: merchantImageTooLargeMessage() };
  }

  const kind = sniffImageKindFromBytes(body);
  if (!isAllowedKind(kind)) {
    return { ok: false, message: merchantImageUnsupportedMessage(kind) };
  }

  return {
    ok: true,
    ext: kind,
    contentType: kind === "jpeg" ? "image/jpeg" : "image/png",
  };
}
