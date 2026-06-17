/** 하단 4탭 SPA 셸 — URL 경로와 1:1 */
export const MERCHANT_MAIN_TABS = ["dashboard", "orders", "menus", "analytics"] as const;

export type MerchantMainTab = (typeof MERCHANT_MAIN_TABS)[number];

export function merchantTenantBase(tenant: string): string {
  return `/m/${encodeURIComponent(tenant.trim())}`;
}

export function merchantMainTabHref(tenant: string, tab: MerchantMainTab): string {
  return `${merchantTenantBase(tenant)}/${tab}`;
}

export function merchantMainTabFromPathname(
  pathname: string,
  tenant: string,
): MerchantMainTab | null {
  const base = merchantTenantBase(tenant);
  if (pathname === `${base}/dashboard`) return "dashboard";
  if (pathname.startsWith(`${base}/orders`)) return "orders";
  if (pathname.startsWith(`${base}/menus`)) return "menus";
  if (pathname.startsWith(`${base}/analytics`)) return "analytics";
  return null;
}

export function isMerchantMainTabPath(pathname: string, tenant: string): boolean {
  return merchantMainTabFromPathname(pathname, tenant) != null;
}

/** `/menus` 목록이 아닌 추가·수정 등 서브 라우트 */
export function isMerchantMenusSubRoute(pathname: string, tenant: string): boolean {
  const list = `${merchantTenantBase(tenant)}/menus`;
  return pathname.startsWith(`${list}/`);
}
