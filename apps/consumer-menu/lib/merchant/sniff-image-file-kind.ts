/** 클라이언트·서버 공통 — 파일 MIME·확장자·매직 바이트로 이미지 종류 추정 */

export type SniffedImageKind = "jpeg" | "png" | "webp" | "heic" | "heif" | "unknown";

function kindFromMime(mime: string): SniffedImageKind | null {
  const t = mime.trim().toLowerCase();
  if (!t.startsWith("image/")) return null;
  if (t.includes("jpeg") || t === "image/jpg" || t === "image/pjpeg") return "jpeg";
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("heic")) return "heic";
  if (t.includes("heif")) return "heif";
  return null;
}

function kindFromName(name: string): SniffedImageKind | null {
  const lower = name.trim().toLowerCase();
  if (/\.jpe?g$/i.test(lower)) return "jpeg";
  if (/\.png$/i.test(lower)) return "png";
  if (/\.webp$/i.test(lower)) return "webp";
  if (/\.heic$/i.test(lower)) return "heic";
  if (/\.heif$/i.test(lower)) return "heif";
  return null;
}

export function sniffImageKindFromBytes(buf: Uint8Array): SniffedImageKind {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "png";
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
    return "webp";
  }
  if (buf.length >= 12 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = String.fromCharCode(buf[8]!, buf[9]!, buf[10]!, buf[11]!).toLowerCase();
    if (brand.startsWith("heic") || brand.startsWith("heix") || brand.startsWith("hevc")) return "heic";
    if (brand.startsWith("mif1") || brand.startsWith("msf1") || brand.startsWith("heif")) return "heif";
  }
  return "unknown";
}

export async function sniffImageFileKind(file: File): Promise<SniffedImageKind> {
  const fromMime = kindFromMime(file.type);
  if (fromMime) return fromMime;

  const fromName = kindFromName(file.name);
  if (fromName) return fromName;

  try {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    return sniffImageKindFromBytes(head);
  } catch {
    return "unknown";
  }
}
