import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { isAllowedMenuImagePublicUrl } from "@/lib/menus/is-allowed-menu-image-url";

function clampDimension(raw: string | null, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(512, Math.max(32, Math.round(n)));
}

/** Supabase public 메뉴 이미지 → WebP 썸네일 (render/image 403 대체) */
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u")?.trim();
  if (!u || !isAllowedMenuImagePublicUrl(u)) {
    return new NextResponse("invalid url", { status: 400 });
  }

  const w = clampDimension(req.nextUrl.searchParams.get("w"), 128);
  const h = clampDimension(req.nextUrl.searchParams.get("h"), w);

  const upstream = await fetch(u);
  if (!upstream.ok) {
    return new NextResponse("upstream error", { status: upstream.status === 404 ? 404 : 502 });
  }

  const input = Buffer.from(await upstream.arrayBuffer());
  const out = await sharp(input)
    .rotate()
    .resize(w, h, { fit: "cover", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  return new NextResponse(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
