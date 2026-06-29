import type { Metadata } from "next";

/** 소비자 PWA — 베이지 배경 + 브라운 C */
export const CHAYA_CONSUMER_ICON = "/icons/chaya-consumer-icon.png";

export const chayaConsumerPwaBrand = {
  backgroundColor: "#E8C4A0",
  themeColor: "#5C3A28",
  icon: CHAYA_CONSUMER_ICON,
} as const;

/** 점주 PWA — 브라운 배경 + 화이트 C */
export const CHAYA_STORE_ICON = "/icons/chaya-store-icon.png";

export const chayaMerchantPwaBrand = {
  backgroundColor: "#6B4228",
  themeColor: "#6B4228",
  icon: CHAYA_STORE_ICON,
} as const;

export function chayaPwaManifestIcons(iconSrc: string) {
  return [
    { src: iconSrc, sizes: "512x512", type: "image/png" as const, purpose: "any" as const },
    { src: iconSrc, sizes: "512x512", type: "image/png" as const, purpose: "maskable" as const },
  ];
}

export function chayaPwaMetadataIcons(iconSrc: string): NonNullable<Metadata["icons"]> {
  return {
    icon: [{ url: iconSrc, type: "image/png" }],
    apple: [{ url: iconSrc, type: "image/png" }],
  };
}
