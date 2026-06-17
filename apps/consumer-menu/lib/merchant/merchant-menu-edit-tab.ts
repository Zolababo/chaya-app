export const MERCHANT_MENU_EDIT_TABS = ["basic", "photo", "advanced"] as const;

export type MerchantMenuEditTab = (typeof MERCHANT_MENU_EDIT_TABS)[number];

export function parseMerchantMenuEditTab(v: string | undefined): MerchantMenuEditTab {
  if (v === "photo" || v === "advanced") return v;
  return "basic";
}

export function merchantMenuEditHref(
  tenant: string,
  menuId: string,
  opts?: { tab?: MerchantMenuEditTab; category?: string | null },
): string {
  const t = encodeURIComponent(tenant);
  const id = encodeURIComponent(menuId);
  const params = new URLSearchParams();
  if (opts?.tab && opts.tab !== "basic") params.set("tab", opts.tab);
  if (opts?.category?.trim()) params.set("category", opts.category.trim());
  const q = params.toString();
  return `/m/${t}/menus/${id}${q ? `?${q}` : ""}`;
}
