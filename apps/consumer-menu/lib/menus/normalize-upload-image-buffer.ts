import "server-only";

import sharp from "sharp";

import { convertHeicBufferToJpeg, isHeicBuffer } from "./convert-heic-buffer";

const MAX_SIDE = 1200;
const JPEG_QUALITY = 88;

export type NormalizedUploadImage = {
  body: Buffer;
  contentType: "image/jpeg";
  ext: "jpg";
};

async function sharpToJpeg(input: Buffer): Promise<Buffer | null> {
  try {
    const out = await sharp(input, { failOn: "none", animated: false })
      .rotate()
      .resize({
        width: MAX_SIDE,
        height: MAX_SIDE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    return out.length > 0 ? out : null;
  } catch (err) {
    console.error("[normalizeUploadImageBuffer/sharp]", err instanceof Error ? err.message : err);
    return null;
  }
}

/** 카메라·HEIC·고해상도 → JPEG 리사이즈 (서버 전용) */
export async function normalizeUploadImageBuffer(
  input: Buffer | Uint8Array,
): Promise<NormalizedUploadImage | null> {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (!buf.length) return null;

  const direct = await sharpToJpeg(buf);
  if (direct) {
    return { body: direct, contentType: "image/jpeg", ext: "jpg" };
  }

  if (!isHeicBuffer(buf)) return null;

  const heicJpeg = await convertHeicBufferToJpeg(buf);
  if (!heicJpeg) return null;

  const converted = await sharpToJpeg(heicJpeg);
  if (!converted) return null;

  return { body: converted, contentType: "image/jpeg", ext: "jpg" };
}
