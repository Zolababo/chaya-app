/** same-origin `/menu-thumb` 썸네일 (Supabase render/image 미사용) */
export type MenuThumbVariant = "list" | "large" | "xlarge" | "promo";

const THUMB_PX: Record<MenuThumbVariant, number> = {
  list: 128,
  large: 192,
  xlarge: 256,
  promo: 160,
};

const OBJECT_PUBLIC = "/storage/v1/object/public/";

export function optimizeMenuThumbUrl(
  imageUrl: string | null | undefined,
  variant: MenuThumbVariant = "list",
): string | null {
  const raw = imageUrl?.trim();
  if (!raw) return null;

  if (raw.indexOf(OBJECT_PUBLIC) === -1) return raw;

  const px = THUMB_PX[variant];
  return `/menu-thumb?u=${encodeURIComponent(raw)}&w=${px}&h=${px}`;
}

/** 첫 화면 preload용 — 목록 상단 1장 */
export function firstMenuBoardThumbUrl(
  items: { imageUrl: string | null }[],
  variant: MenuThumbVariant = "list",
): string | null {
  for (const item of items) {
    const url = optimizeMenuThumbUrl(item.imageUrl, variant);
    if (url) return url;
  }
  return null;
}
