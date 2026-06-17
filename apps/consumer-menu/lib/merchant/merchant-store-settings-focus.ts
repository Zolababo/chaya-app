/** `/more/store?focus=` — 바텀시트 행별 진입 */
export const MERCHANT_STORE_FOCUS_VALUES = ["name", "logo", "intro"] as const;

export type MerchantStoreFocus = (typeof MERCHANT_STORE_FOCUS_VALUES)[number];

export function parseMerchantStoreFocus(raw: string | undefined | null): MerchantStoreFocus | null {
  const v = raw?.trim();
  if (v === "name" || v === "logo" || v === "intro") return v;
  return null;
}

export function merchantStoreSettingsHref(tenant: string, focus?: MerchantStoreFocus | null): string {
  const base = `/m/${encodeURIComponent(tenant)}/more/store`;
  if (!focus) return base;
  return `${base}?focus=${focus}`;
}

export function merchantStoreSettingsPageTitle(focus: MerchantStoreFocus | null): string {
  switch (focus) {
    case "name":
      return "매장명 변경";
    case "logo":
      return "로고 변경";
    case "intro":
      return "매장 소개";
    default:
      return "매장 정보";
  }
}
