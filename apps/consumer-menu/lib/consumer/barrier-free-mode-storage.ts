import {
  DEFAULT_A11Y_PREFERENCES,
  writeA11yPreferences,
  type ConsumerA11yPreferences,
} from "@/lib/consumer/a11y-preferences-storage";
import { writeScreenReaderMode } from "@/lib/consumer/screen-reader-mode-storage";

/** 베리어프리 ON — 목록형 메뉴 + 큰 UI + SR 라벨 (앱 TTS·고대비 없음) */
export const BARRIER_FREE_ACTIVE_PREFS: ConsumerA11yPreferences = {
  fontScale: "xl",
  highContrast: false,
  voiceEnabled: false,
};

const KEY_PREFIX = "chaya_barrier_free_v1:";

function storageKey(tenant: string): string {
  return `${KEY_PREFIX}${encodeURIComponent(tenant.trim())}`;
}

function readLegacyBarrierFree(tenant: string): boolean {
  const enc = encodeURIComponent(tenant.trim());
  try {
    const sr = sessionStorage.getItem(`chaya_sr_mode_v1:${enc}`);
    if (sr === "1") return true;
    if (sr === "0") return false;

    const legacyEasy = sessionStorage.getItem(`chaya_easy_mode_v1:${enc}`);
    if (legacyEasy === "1") return true;

    const raw = sessionStorage.getItem(`chaya_a11y_prefs_v1:${enc}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ConsumerA11yPreferences>;
      if (parsed.fontScale === "large" || parsed.fontScale === "xl") return true;
      if (parsed.highContrast === true || parsed.voiceEnabled === true) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function readBarrierFreeMode(tenant: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(storageKey(tenant));
    if (raw === "1") return true;
    if (raw === "0") return false;
    return readLegacyBarrierFree(tenant);
  } catch {
    return false;
  }
}

export function writeBarrierFreeMode(tenant: string, on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(tenant), on ? "1" : "0");
    writeA11yPreferences(tenant, on ? BARRIER_FREE_ACTIVE_PREFS : DEFAULT_A11Y_PREFERENCES);
    writeScreenReaderMode(tenant, on);
  } catch {
    /* ignore quota / private mode */
  }
}
