/** QR `?exp=&sig=` — 주문 submit 검증용 (세션·탭 단위). */

export type TableQrTokenPref = {
  table: string;
  exp: number;
  sig: string;
};

function storageKey(tenant: string): string {
  return `chaya_table_qr:${tenant.trim()}`;
}

export function writeTableQrTokenPref(tenant: string, pref: TableQrTokenPref): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(tenant), JSON.stringify(pref));
  } catch {
    /* quota / private mode */
  }
}

export function readTableQrTokenPref(tenant: string): TableQrTokenPref | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(tenant));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TableQrTokenPref;
    if (
      !parsed ||
      typeof parsed.table !== "string" ||
      typeof parsed.sig !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    return {
      table: parsed.table.trim(),
      sig: parsed.sig.trim(),
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function clearTableQrTokenPref(tenant: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(tenant));
  } catch {
    /* ignore */
  }
}
