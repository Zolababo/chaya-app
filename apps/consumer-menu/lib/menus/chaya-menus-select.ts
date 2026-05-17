/** ChayaMenus PostgREST select lists (consumer anon · merchant service 공용). */

export const CHAYA_MENU_SELECT_BASE =
  "id,name,description,price,category,imageUrl,sort_order,is_sold_out";
export const CHAYA_MENU_SELECT_WITH_OPTIONS = `${CHAYA_MENU_SELECT_BASE},options_json`;
export const CHAYA_MENU_SELECT_FULL = `${CHAYA_MENU_SELECT_WITH_OPTIONS},translations_json`;

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
