const KEY_PREFIX = "chaya_easy_mode_v1:";

export function easyModeStorageKey(tenant: string): string {
  return `${KEY_PREFIX}${encodeURIComponent(tenant.trim())}`;
}

/** 브라우저 탭 단위 — QR 공용 기기에서 세션마다 초기화 */
export function readEasyMode(tenant: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(easyModeStorageKey(tenant)) === "1";
  } catch {
    return false;
  }
}

export function writeEasyMode(tenant: string, on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(easyModeStorageKey(tenant), on ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
}
