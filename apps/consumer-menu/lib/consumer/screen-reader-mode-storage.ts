/** TalkBack/VoiceOver 전용 UI — 테넌트·탭별 sessionStorage */

const KEY_PREFIX = "chaya_sr_mode_v1:";

function storageKey(tenant: string): string {
  return `${KEY_PREFIX}${encodeURIComponent(tenant.trim())}`;
}

export function readScreenReaderMode(tenant: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(storageKey(tenant));
    if (raw === "1") return true;
    if (raw === "0") return false;
    /* 이전 저시력 easy 모드 마이그레이션 — SR 모드는 꺼진 채 시작 */
    const legacyPrefs = sessionStorage.getItem(`chaya_a11y_prefs_v1:${encodeURIComponent(tenant.trim())}`);
    if (legacyPrefs) {
      try {
        const parsed = JSON.parse(legacyPrefs) as { fontScale?: string };
        if (parsed.fontScale === "large" || parsed.fontScale === "xl") {
          return true;
        }
      } catch {
        /* ignore */
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function writeScreenReaderMode(tenant: string, on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(tenant), on ? "1" : "0");
  } catch {
    /* ignore */
  }
}
