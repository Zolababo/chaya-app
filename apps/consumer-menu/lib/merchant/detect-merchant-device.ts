export type MerchantDeviceInfo = {
  /** 기기 모델명 또는 OS 이름 */
  label: string;
  /** OS·브라우저 등 보조 정보 */
  meta: string | null;
};

function parseAndroidModel(ua: string): string | null {
  const m = ua.match(/Android\s+[\d.]+;\s*([^;)]+?)(?:\s+Build|\))/i);
  if (!m?.[1]) return null;
  const raw = m[1].replace(/\s*wv\s*$/i, "").trim();
  if (!raw || /^Linux/i.test(raw) || /^Android/i.test(raw)) return null;
  return raw;
}

function parseIosLabel(ua: string): string {
  const ver = ua.match(/OS (\d+[_\d]*)/i)?.[1]?.replace(/_/g, ".");
  return ver ? `iPhone · iOS ${ver}` : "iPhone";
}

function parseDesktopLabel(ua: string): string {
  if (/Windows NT/i.test(ua)) return "Windows PC";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/CrOS/i.test(ua)) return "Chromebook";
  if (/Linux/i.test(ua)) return "Linux PC";
  return "이 기기";
}

function parseModelFromUserAgent(ua: string): string {
  if (/iPad/i.test(ua)) {
    const ver = ua.match(/OS (\d+[_\d]*)/i)?.[1]?.replace(/_/g, ".");
    return ver ? `iPad · iPadOS ${ver}` : "iPad";
  }
  if (/iPhone/i.test(ua)) return parseIosLabel(ua);
  const android = parseAndroidModel(ua);
  if (android) return android;
  if (/Android/i.test(ua)) return "Android 기기";
  return parseDesktopLabel(ua);
}

type UaData = {
  getHighEntropyValues: (hints: string[]) => Promise<{
    model?: string;
    platform?: string;
    platformVersion?: string;
  }>;
};

/** 이 기기 표시명 — Client Hints 우선, 없으면 UA 파싱 */
export async function detectMerchantDeviceInfo(): Promise<MerchantDeviceInfo> {
  if (typeof navigator === "undefined") {
    return { label: "이 기기", meta: null };
  }

  const uaData = (navigator as Navigator & { userAgentData?: UaData }).userAgentData;
  if (uaData?.getHighEntropyValues) {
    try {
      const hints = await uaData.getHighEntropyValues(["model", "platform", "platformVersion"]);
      const model = hints.model?.trim();
      const platform = hints.platform?.trim();
      if (model && model !== "" && !/^K$/i.test(model)) {
        const meta = platform
          ? `${platform}${hints.platformVersion ? ` ${hints.platformVersion}` : ""}`
          : null;
        return { label: model, meta };
      }
      if (platform) {
        return {
          label: parseModelFromUserAgent(navigator.userAgent),
          meta: hints.platformVersion ? `${platform} ${hints.platformVersion}` : platform,
        };
      }
    } catch {
      /* Client Hints 거부 — UA 폴백 */
    }
  }

  return { label: parseModelFromUserAgent(navigator.userAgent), meta: null };
}
