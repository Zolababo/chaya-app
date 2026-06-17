/** ChayaMenus PostgREST select lists (consumer anon · merchant service 공용). */

export const CHAYA_MENU_SELECT_MERCH =
  "id,name,description,price,category,imageUrl,sort_order,is_sold_out,is_todays_pick,is_store_recommended";
/** 점주 홈 메뉴 현황 카드 — 최소 컬럼 */
export const CHAYA_MENU_SELECT_HOME = "id,name,price,category,is_sold_out,sort_order";
export const CHAYA_MENU_SELECT_BASE = `${CHAYA_MENU_SELECT_MERCH},created_at`;
export const CHAYA_MENU_SELECT_WITH_OPTIONS = `${CHAYA_MENU_SELECT_BASE},options_json`;
export const CHAYA_MENU_SELECT_FULL = `${CHAYA_MENU_SELECT_WITH_OPTIONS},translations_json`;
export const CHAYA_MENU_SELECT_MERCH_WITH_OPTIONS = `${CHAYA_MENU_SELECT_MERCH},options_json`;
export const CHAYA_MENU_SELECT_MERCH_FULL = `${CHAYA_MENU_SELECT_MERCH_WITH_OPTIONS},translations_json`;

/** 마이그레이션 전 스키마(merchandising 컬럼 없음). */
export const CHAYA_MENU_SELECT_LEGACY_BASE =
  "id,name,description,price,category,imageUrl,sort_order,is_sold_out";
export const CHAYA_MENU_SELECT_LEGACY_HOME = "id,name,price,category,is_sold_out,sort_order";
export const CHAYA_MENU_SELECT_LEGACY_WITH_OPTIONS = `${CHAYA_MENU_SELECT_LEGACY_BASE},options_json`;
export const CHAYA_MENU_SELECT_LEGACY_FULL = `${CHAYA_MENU_SELECT_LEGACY_WITH_OPTIONS},translations_json`;

function errorText(error: { message?: string; details?: string; hint?: string } | null): string {
  if (!error) return "";
  return `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
}

export function isMissingOptionsJsonColumn(
  error: { message?: string; details?: string; hint?: string } | null,
): boolean {
  return errorText(error).includes("options_json");
}

export function isMissingTranslationsJsonColumn(
  error: { message?: string; details?: string; hint?: string } | null,
): boolean {
  return errorText(error).includes("translations_json");
}

export function isMissingMerchandisingColumns(
  error: { message?: string; details?: string; hint?: string } | null,
): boolean {
  const t = errorText(error);
  return t.includes("is_todays_pick") || t.includes("is_store_recommended");
}

export function isMissingCreatedAtColumn(
  error: { message?: string; details?: string; hint?: string } | null,
): boolean {
  return errorText(error).includes("created_at");
}
