import type { TenantStoreSettings } from "@/lib/tenant/tenant-store-settings";

export type TenantBranding = {
  /** URL 슬러그 (원본) */
  slug: string;
  /** 손님 헤더·메타용 표시명 */
  displayName: string;
  /** 매장 로고 URL (없으면 이니셜 플레이스홀더) */
  logoUrl: string | null;
  /** 매장 소개 (선택) */
  intro: string | null;
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

/** 슬러그만으로 기본 브랜딩 (DB 미적용·폴백). */
export function getTenantBranding(tenantSlug: string): TenantBranding {
  const slug = tenantSlug.trim();
  return {
    slug,
    displayName: humanizeTenantSlug(slug),
    logoUrl: null,
    intro: null,
  };
}

/** `tenant_store_settings` 행을 브랜딩으로 변환. */
export function tenantBrandingFromSettings(
  tenantSlug: string,
  settings: TenantStoreSettings | null,
): TenantBranding {
  const slug = tenantSlug.trim();
  const fallback = getTenantBranding(slug);
  if (!settings) return fallback;
  return {
    slug,
    displayName: settings.displayName?.trim() || fallback.displayName,
    logoUrl: settings.logoUrl,
    intro: settings.intro,
  };
}
