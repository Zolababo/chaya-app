/** 매장 로고 — HEIC·카메라 사진을 JPEG로 변환 (클라이언트 전용) */

export class LogoUploadNormalizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LogoUploadNormalizeError";
  }
}

const MAX_SIDE = 800;
const JPEG_QUALITY = 0.82;
const UPLOAD_BUDGET_BYTES = 1_500_000;

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
  try {
    const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (buf.length < 12 || buf[4] !== 0x66 || buf[5] !== 0x74 || buf[6] !== 0x79 || buf[7] !== 0x70) {
      return false;
    }
    const brand = String.fromCharCode(buf[8]!, buf[9]!, buf[10]!, buf[11]!).toLowerCase();
    return (
      brand.startsWith("heic") ||
      brand.startsWith("heix") ||
      brand.startsWith("hevc") ||
      brand.startsWith("mif1") ||
      brand.startsWith("msf1") ||
      brand.startsWith("heif")
    );
  } catch {
    return false;
  }
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
    /* Image() 폴백 */
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

  let maxSide = MAX_SIDE;
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

/** canvas 단순 루프 — createImageBitmap·HEIC 실패 시 (갤럭시 카메라) */
export async function forceLogoJpegUnderBytes(file: File, budgetBytes: number): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    let maxSide = 720;
    let quality = 0.82;

    for (let i = 0; i < 10; i++) {
      const { w, h } = scaleDimensions(img.naturalWidth, img.naturalHeight, maxSide);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) break;
      ctx.drawImage(img, 0, 0, w, h);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });
      if (blob && blob.size > 0 && blob.size <= budgetBytes) {
        return new File([blob], "logo.jpg", { type: "image/jpeg", lastModified: Date.now() });
      }

      quality = Math.max(0.45, quality - 0.08);
      maxSide = Math.max(400, Math.round(maxSide * 0.82));
    }
  } finally {
    URL.revokeObjectURL(url);
  }

  throw new LogoUploadNormalizeError("사진을 JPEG로 줄이지 못했어요.");
}
