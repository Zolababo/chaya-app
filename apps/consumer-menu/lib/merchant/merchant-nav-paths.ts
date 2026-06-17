/** 점주 「더보기」 드롭다운·설정 화면 경로 (분석 `/analytics` 제외). */
export const MERCHANT_MORE_ROUTE_SEGMENTS = [
  "/more",
  "/tables",
  "/readiness",
  "/categories",
  "/audit",
] as const;

export function isMerchantMoreRoute(pathname: string, tenantBase: string): boolean {
  if (MERCHANT_MORE_ROUTE_SEGMENTS.some((seg) => pathname.includes(`${tenantBase}${seg}`))) {
    return true;
  }
  return pathname.includes(`${tenantBase}/more/`);
}

export function isMerchantAnalyticsRoute(pathname: string, tenantBase: string): boolean {
  return pathname.includes(`${tenantBase}/analytics`);
}
