import {
  convertHeicLogoFileToJpeg,
  forceLogoJpegUnderBytes,
  isHeicLogoFile,
  prepareLogoUploadFile,
} from "@/lib/merchant/normalize-logo-upload-file";

/** Vercel 요청 본문 상한(≈4.5MB) 여유 — 로고·메뉴 사진 공통 */
export const MERCHANT_IMAGE_UPLOAD_BODY_BUDGET = 3_500_000;

/** 점주 사진 업로드 전 — HEIC·고해상도 → JPEG·용량 상한 */
export async function buildMerchantImageUploadPayload(file: File): Promise<File> {
  if (file.size === 0) {
    throw new Error("빈 파일입니다. 다른 사진을 선택해 주세요.");
  }

  let working = file;
  if (await isHeicLogoFile(file)) {
    const jpeg = await convertHeicLogoFileToJpeg(file);
    if (jpeg) {
      working = jpeg;
    } else if (file.size > MERCHANT_IMAGE_UPLOAD_BODY_BUDGET) {
      throw new Error(
        "HEIC 사진이 너무 커요. 갤러리에서 같은 사진을 다시 선택하거나 카메라 품질을 낮춰 주세요.",
      );
    }
  }

  if (working.size <= MERCHANT_IMAGE_UPLOAD_BODY_BUDGET) {
    return working;
  }

  try {
    const prepared = await prepareLogoUploadFile(working);
    if (prepared.size <= MERCHANT_IMAGE_UPLOAD_BODY_BUDGET) return prepared;
  } catch {
    /* 대용량만 클라이언트 압축 */
  }

  try {
    return await forceLogoJpegUnderBytes(working, MERCHANT_IMAGE_UPLOAD_BODY_BUDGET);
  } catch {
    throw new Error(
      "사진이 너무 커요. 카메라 품질을 낮추거나 조금 멀리서 다시 촬영해 주세요.",
    );
  }
}
