export type TenantBranding = {
  /** URL 슬러그 (원본) */
  slug: string;
  /** 손님 헤더·메타용 표시명 */
  displayName: string;
  /** 매장 로고 URL (없으면 이니셜 플레이스홀더) */
  logoUrl: string | null;
};

function humanizeTenantSlug(slug: string): string {
  const raw = decodeURIComponent(slug).trim();
  if (!raw) return "CHAYA";
  return raw
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** 손님 헤더 브랜딩. 추후 tenants 테이블·로고 URL 연동 시 이 함수만 확장. */
export function getTenantBranding(tenantSlug: string): TenantBranding {
  const slug = tenantSlug.trim();
  return {
    slug,
    displayName: humanizeTenantSlug(slug),
    logoUrl: null,
  };
}
