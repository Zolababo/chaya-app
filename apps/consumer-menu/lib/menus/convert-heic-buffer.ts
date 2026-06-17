import "server-only";

/** HEIC/HEIF 바이트 → JPEG (Vercel·sharp HEIC 미지원 폴백) */

export function isHeicBuffer(buf: Uint8Array): boolean {
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
}

export async function convertHeicBufferToJpeg(
  input: Buffer | Uint8Array,
  quality = 0.88,
): Promise<Buffer | null> {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (!isHeicBuffer(buf)) return null;

  try {
    const convert = (await import("heic-convert")).default;
    const out = await convert({
      buffer: buf,
      format: "JPEG",
      quality,
    });
    const jpeg = Buffer.from(out);
    return jpeg.length > 0 ? jpeg : null;
  } catch (err) {
    console.error("[convertHeicBufferToJpeg]", err instanceof Error ? err.message : err);
    return null;
  }
}
