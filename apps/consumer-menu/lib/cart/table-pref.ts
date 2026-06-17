/** QR `?table=` 과 장바구니 테이블 입력 연동 (submit-guest-order 와 동일 상한). */
export const PREF_TABLE_MAX = 30;

export const CHAYA_TABLE_PREF_CHANGED_EVENT = "chaya:table-pref-changed";

function notifyTablePrefChanged(tenant: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CHAYA_TABLE_PREF_CHANGED_EVENT, {
      detail: { tenant: tenant.trim() },
    }),
  );
}

export function tablePrefStorageKey(tenant: string): string {
  return `chaya_pref_table:${tenant.trim()}`;
}

/**
 * URL 쿼리 `table` 값을 로컬에 반영합니다.
 * @param tableParam `null` 이면 쿼리 키가 없음 → 저장 값을 건드리지 않습니다. `""` 이면 저장을 지웁니다.
 */
export function persistTablePrefFromQuery(tenant: string, tableParam: string | null): void {
  if (typeof window === "undefined") return;
  const key = tablePrefStorageKey(tenant);
  try {
    if (tableParam === null) return;
    const t = tableParam.trim().slice(0, PREF_TABLE_MAX);
    if (t) localStorage.setItem(key, t);
    else localStorage.removeItem(key);
    notifyTablePrefChanged(tenant);
  } catch {
    /* quota / private mode */
  }
}

/** 장바구니·헤더에서 테이블 번호를 바꿀 때 호출합니다. */
export function writeTablePref(tenant: string, value: string): void {
  if (typeof window === "undefined") return;
  const key = tablePrefStorageKey(tenant);
  try {
    const t = value.trim().slice(0, PREF_TABLE_MAX);
    if (t) localStorage.setItem(key, t);
    else localStorage.removeItem(key);
    notifyTablePrefChanged(tenant);
  } catch {
    /* quota / private mode */
  }
}

export function readTablePref(tenant: string): string {
  if (typeof window === "undefined") return "";
  try {
    return (localStorage.getItem(tablePrefStorageKey(tenant)) ?? "").trim().slice(0, PREF_TABLE_MAX);
  } catch {
    return "";
  }
}
