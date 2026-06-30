/** 매장 로고 — HEIC·카메라 사진을 JPEG로 변환 (클라이언트 전용) */

import { sniffImageFileKind } from "@/lib/merchant/sniff-image-file-kind";

export class LogoUploadNormalizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LogoUploadNormalizeError";
  }
}

const MAX_SIDE = 800;
const JPEG_QUALITY = 0.82;
const UPLOAD_BUDGET_BYTES = 1_500_000;

function initialMaxSideForBytes(bytes: number): number {
  if (bytes > 12 * 1024 * 1024) return 480;
  if (bytes > 8 * 1024 * 1024) return 560;
  if (bytes > 4 * 1024 * 1024) return 640;
  return MAX_SIDE;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = src;
  });
}

function isHeicLike(file: File): boolean {
  const t = file.type.trim().toLowerCase();
  if (t.includes("heic") || t.includes("heif")) return true;
  return /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);
}

async function sniffHeicBytes(file: File): Promise<boolean> {
  const kind = await sniffImageFileKind(file);
  return kind === "heic" || kind === "heif";
}

async function heicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: JPEG_QUALITY });
  const blob = Array.isArray(out) ? out[0] : out;
  if (!blob || blob.size === 0) {
    throw new LogoUploadNormalizeError("heic_empty");
  }
  return new File([blob], "logo.jpg", { type: "image/jpeg", lastModified: Date.now() });
}

function scaleDimensions(w: number, h: number, maxSide: number): { w: number; h: number } {
  if (w <= maxSide && h <= maxSide) return { w, h };
  const scale = maxSide / Math.max(w, h);
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

async function canvasJpegFromBitmap(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<File> {
  const { w, h } = scaleDimensions(bitmap.width, bitmap.height, maxSide);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new LogoUploadNormalizeError("canvas_unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob || blob.size === 0) throw new LogoUploadNormalizeError("jpeg_empty");
  return new File([blob], "logo.jpg", { type: "image/jpeg", lastModified: Date.now() });
}

async function decodeWithBitmap(file: File, maxSide: number, quality: number): Promise<File> {
  if (typeof createImageBitmap !== "function") {
    throw new LogoUploadNormalizeError("bitmap_unavailable");
  }

  const attempts: ImageBitmapOptions[] = [
    {
      resizeWidth: maxSide,
      resizeHeight: maxSide,
      resizeQuality: "high",
      imageOrientation: "from-image",
    },
    { resizeWidth: maxSide, resizeHeight: maxSide, resizeQuality: "medium" },
    {},
  ];

  let lastErr: unknown;
  for (const options of attempts) {
    try {
      const bitmap = await createImageBitmap(file, options);
      return await canvasJpegFromBitmap(bitmap, maxSide, quality);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new LogoUploadNormalizeError("bitmap_decode_failed");
}

async function rasterToJpeg(file: File, maxSide: number, quality: number): Promise<File> {
  try {
    return await decodeWithBitmap(file, maxSide, quality);
  } catch {
    /* Image() 폴백 — 소형 파일만 (갤럭시 고해상도는 전체 디코드 시 OOM) */
  }

  if (file.size > 2_500_000) {
    throw new LogoUploadNormalizeError("bitmap_decode_failed");
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { w, h } = scaleDimensions(img.naturalWidth, img.naturalHeight, maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new LogoUploadNormalizeError("canvas_unavailable");
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
    if (!blob || blob.size === 0) throw new LogoUploadNormalizeError("jpeg_empty");
    return new File([blob], "logo.jpg", { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function normalizeOnce(file: File, maxSide: number, quality: number): Promise<File> {
  const heic = isHeicLike(file) || (await sniffHeicBytes(file));
  if (heic) {
    try {
      const jpeg = await heicToJpeg(file);
      return await rasterToJpeg(jpeg, maxSide, quality);
    } catch {
      /* Android·갤럭시 HEIC — 서버 sharp에 맡기기 위해 원본 시도 */
      return file;
    }
  }
  return await rasterToJpeg(file, maxSide, quality);
}

/** 업로드 전 — 리사이즈·JPEG·용량 상한 (카메라 고해상도 대응) */
export async function prepareLogoUploadFile(file: File): Promise<File> {
  if (file.size === 0) {
    throw new LogoUploadNormalizeError("빈 파일입니다. 다른 사진을 선택해 주세요.");
  }

  let maxSide = initialMaxSideForBytes(file.size);
  let quality = JPEG_QUALITY;
  let last: File | null = null;

  for (let i = 0; i < 6; i++) {
    try {
      last = await normalizeOnce(file, maxSide, quality);
    } catch (err) {
      if (!(err instanceof LogoUploadNormalizeError) && i === 0) {
        try {
          last = await heicToJpeg(file).then((jpeg) => rasterToJpeg(jpeg, maxSide, quality));
        } catch {
          throw new LogoUploadNormalizeError(
            "사진을 불러오지 못했어요. 갤러리에서 같은 사진을 다시 선택해 주세요.",
          );
        }
      } else {
        throw new LogoUploadNormalizeError(
          "사진을 불러오지 못했어요. 갤러리에서 같은 사진을 다시 선택해 주세요.",
        );
      }
    }

    if (last && last.size <= UPLOAD_BUDGET_BYTES) return last;
    quality = Math.max(0.55, quality - 0.08);
    maxSide = Math.max(480, Math.round(maxSide * 0.85));
  }

  if (last && last.size <= 5 * 1024 * 1024) return last;
  throw new LogoUploadNormalizeError(
    "사진이 너무 커요. 카메라 품질을 낮추거나 조금 멀리서 다시 촬영해 주세요.",
  );
}

/** @deprecated prepareLogoUploadFile 사용 */
export async function normalizeLogoUploadFile(file: File): Promise<File> {
  return prepareLogoUploadFile(file);
}

export function canUseRawLogoUpload(file: File): boolean {
  return file.size > 0 && file.size <= 5 * 1024 * 1024;
}

export async function isHeicLogoFile(file: File): Promise<boolean> {
  return isHeicLike(file) || (await sniffHeicBytes(file));
}

/** heic2any — 성공 시 JPEG, 실패 시 null (서버 heic-convert 폴백) */
export async function convertHeicLogoFileToJpeg(file: File): Promise<File | null> {
  try {
    return await heicToJpeg(file);
  } catch {
    return null;
  }
}

/** createImageBitmap 우선 — 갤럭시·고해상도 카메라 JPEG OOM 방지 */
export async function forceLogoJpegUnderBytes(file: File, budgetBytes: number): Promise<File> {
  let maxSide = initialMaxSideForBytes(file.size);
  let quality = 0.82;

  for (let i = 0; i < 12; i++) {
    try {
      const jpeg = await decodeWithBitmap(file, maxSide, quality);
      if (jpeg.size > 0 && jpeg.size <= budgetBytes) return jpeg;
    } catch {
      /* 더 작게 재시도 */
    }

    quality = Math.max(0.4, quality - 0.07);
    maxSide = Math.max(360, Math.round(maxSide * 0.8));
  }

  if (file.size <= 2_500_000) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      let side = maxSide;
      let q = quality;

      for (let i = 0; i < 6; i++) {
        const { w, h } = scaleDimensions(img.naturalWidth, img.naturalHeight, side);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) break;
        ctx.drawImage(img, 0, 0, w, h);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", q);
        });
        if (blob && blob.size > 0 && blob.size <= budgetBytes) {
          return new File([blob], "logo.jpg", { type: "image/jpeg", lastModified: Date.now() });
        }

        q = Math.max(0.45, q - 0.08);
        side = Math.max(360, Math.round(side * 0.82));
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  throw new LogoUploadNormalizeError("사진을 JPEG로 줄이지 못했어요.");
}
