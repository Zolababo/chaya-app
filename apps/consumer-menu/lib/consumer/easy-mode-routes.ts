/** 테넌트 손님 경로 (`/t/{slug}`) — 큰글씨 토글 시 메뉴판만 barrier-free ↔ 기본 전환 */

export function tenantConsumerBase(tenant: string): string {
  return `/t/${encodeURIComponent(tenant.trim())}`;
}

export function isMenuHomePath(pathname: string, tenant: string): boolean {
  const base = tenantConsumerBase(tenant);
  return pathname === base || pathname === `${base}/`;
}

export function isBarrierFreeMenuPath(pathname: string): boolean {
  return pathname.includes("/barrier-free");
}

/** 기본 메뉴판 ↔ 목록형(큰글씨) 메뉴 URL */
export function menuPathForEasyMode(tenant: string, easyMode: boolean): string {
  const base = tenantConsumerBase(tenant);
  return easyMode ? `${base}/barrier-free` : base;
}
