import {
  MERCHANT_IMAGE_MAX_BYTES,
  validateMerchantImageFile,
} from "@/lib/merchant/merchant-image-upload-policy";

export { MERCHANT_IMAGE_MAX_BYTES as MERCHANT_IMAGE_UPLOAD_BODY_BUDGET } from "@/lib/merchant/merchant-image-upload-policy";

/** 점주 사진 업로드 — JPEG·PNG·3MB 검증만 (클라이언트 변환 없음) */
export async function buildMerchantImageUploadPayload(file: File): Promise<File> {
  const checked = await validateMerchantImageFile(file);
  if (!checked.ok) {
    throw new Error(checked.message);
  }
  return file;
}
