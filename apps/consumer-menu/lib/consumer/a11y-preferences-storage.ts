export type ConsumerFontScale = "normal" | "large" | "xl";

export type ConsumerA11yPreferences = {
  fontScale: ConsumerFontScale;
  highContrast: boolean;
  voiceEnabled: boolean;
};

const KEY_PREFIX = "chaya_a11y_prefs_v1:";

export const DEFAULT_A11Y_PREFERENCES: ConsumerA11yPreferences = {
  fontScale: "normal",
  highContrast: false,
  voiceEnabled: false,
};

function storageKey(tenant: string): string {
  return `${KEY_PREFIX}${encodeURIComponent(tenant.trim())}`;
}

export function readA11yPreferences(tenant: string): ConsumerA11yPreferences {
  if (typeof window === "undefined") return DEFAULT_A11Y_PREFERENCES;
  try {
    const raw = sessionStorage.getItem(storageKey(tenant));
    if (!raw) {
      const legacy = sessionStorage.getItem(`chaya_easy_mode_v1:${encodeURIComponent(tenant.trim())}`);
      if (legacy === "1") {
        return { ...DEFAULT_A11Y_PREFERENCES, fontScale: "large" };
      }
      return DEFAULT_A11Y_PREFERENCES;
    }
    const parsed = JSON.parse(raw) as Partial<ConsumerA11yPreferences>;
    const fontScale =
      parsed.fontScale === "large" || parsed.fontScale === "xl" ? parsed.fontScale : "normal";
    return {
      fontScale,
      highContrast: parsed.highContrast === true,
      voiceEnabled: parsed.voiceEnabled === true,
    };
  } catch {
    return DEFAULT_A11Y_PREFERENCES;
  }
}

export function writeA11yPreferences(tenant: string, prefs: ConsumerA11yPreferences): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(tenant), JSON.stringify(prefs));
    sessionStorage.setItem(
      `chaya_easy_mode_v1:${encodeURIComponent(tenant.trim())}`,
      prefs.fontScale === "normal" ? "0" : "1",
    );
  } catch {
    /* ignore quota / private mode */
  }
}
