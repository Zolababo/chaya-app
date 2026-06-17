/** 탭(브라우저 세션)당 매장별 qr_scan 1회 — 홈 재진입 시 revisit 중복 방지 */
export function qrScanTabSessionKey(tenant: string): string {
  return `chaya_qr_scan_fired:${tenant.trim()}`;
}

export function hasQrScanFiredThisTab(tenant: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(qrScanTabSessionKey(tenant)) === "1";
  } catch {
    return false;
  }
}

export function markQrScanFiredThisTab(tenant: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(qrScanTabSessionKey(tenant), "1");
  } catch {
    /* ignore */
  }
}
