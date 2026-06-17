export type MerchantMenusTab = "all" | "selling" | "soldout";

/** 점주 메뉴 목록 URL (`tab`, `category` 쿼리). */
export function merchantMenusHref(
  tenant: string,
  opts?: {
    category?: string | null;
    /** @deprecated sold_out=1 대신 tab="soldout" 사용 권장 */
    soldOutOnly?: boolean;
    tab?: MerchantMenusTab | null;
    /** 가로 2-pane — 선택 메뉴 id */
    menuId?: string | null;
  },
): string {
  const t = encodeURIComponent(tenant);
  const params = new URLSearchParams();
  if (opts?.category?.trim()) params.set("category", opts.category.trim());
  // tab 우선, 하위 호환으로 soldOutOnly 도 tab=soldout 으로 변환
  const tab = opts?.tab ?? (opts?.soldOutOnly ? "soldout" : null);
  if (tab && tab !== "all") params.set("tab", tab);
  if (opts?.menuId?.trim()) params.set("menu", opts.menuId.trim());
  const q = params.toString();
  return `/m/${t}/menus${q ? `?${q}` : ""}`;
}

export function isMerchantMenusSoldOutFilter(v: string | undefined): boolean {
  return v === "1" || v === "true";
}
