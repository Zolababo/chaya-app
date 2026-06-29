/** TalkBack/VoiceOver 모드 — 메뉴 URL 전환 */

export function tenantConsumerBase(tenant: string): string {
  return `/t/${encodeURIComponent(tenant.trim())}`;
}

export function isMenuHomePath(pathname: string, tenant: string): boolean {
  const base = tenantConsumerBase(tenant);
  return pathname === base || pathname === `${base}/`;
}

export function isScreenReaderMenuPath(pathname: string): boolean {
  return pathname.includes("/barrier-free");
}

/** `/t/{tenant}` 세그먼트에서 tenant slug 추출 */
export function tenantSlugFromConsumerPath(pathname: string): string | null {
  const match = pathname.match(/^\/t\/([^/?#]+)/);
  if (!match) return null;
  try {
    const slug = decodeURIComponent(match[1]).trim();
    return slug || null;
  } catch {
    return match[1].trim() || null;
  }
}

/**
 * 손님앱 핀치 줌 — 베리어프리(SR) 토글이 켜진 동안 `/t/{tenant}/*` 전체에서 허용.
 */
export function isConsumerPinchZoomAllowed(screenReaderMode: boolean): boolean {
  return screenReaderMode;
}

/** 기본 그리드 메뉴 ↔ 스크린 리더 목록 메뉴 */
export function menuPathForScreenReaderMode(tenant: string, screenReaderMode: boolean): string {
  const base = tenantConsumerBase(tenant);
  return screenReaderMode ? `${base}/barrier-free` : base;
}
