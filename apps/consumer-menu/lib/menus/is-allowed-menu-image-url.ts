function menuImagesBucket(): string {
  return process.env.SUPABASE_MENU_IMAGES_BUCKET?.trim() || "menu-images";
}

/** 메뉴 썸네일 프록시가 fetch 허용하는 Supabase public URL만 */
export function isAllowedMenuImagePublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return false;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (!supabaseUrl) return false;

    const supabaseHost = new URL(supabaseUrl).hostname;
    if (parsed.hostname !== supabaseHost) return false;

    const bucket = menuImagesBucket();
    const marker = `/storage/v1/object/public/${bucket}/`;
    if (!parsed.pathname.includes(marker)) return false;

    const suffix = parsed.pathname.slice(parsed.pathname.indexOf(marker) + marker.length);
    if (!suffix || suffix.includes("..")) return false;

    return true;
  } catch {
    return false;
  }
}
