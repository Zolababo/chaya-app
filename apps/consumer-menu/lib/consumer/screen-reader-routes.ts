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

/** 기본 그리드 메뉴 ↔ 스크린 리더 목록 메뉴 */
export function menuPathForScreenReaderMode(tenant: string, screenReaderMode: boolean): string {
  const base = tenantConsumerBase(tenant);
  return screenReaderMode ? `${base}/barrier-free` : base;
}
