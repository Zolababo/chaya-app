import { NextResponse } from "next/server";

import {
  chayaMerchantPwaBrand,
  chayaPwaManifestIcons,
} from "@/lib/pwa/chaya-pwa-brand";

const MANIFEST = {
  name: "CHAYA 점주",
  short_name: "CHAYA 점주",
  description: "매장 주문·메뉴·매출 관리",
  start_url: "/m",
  /** 로그인 후 단일 매장은 `/dashboard`로 리다이렉트. 매장별 PWA는 `/m/{tenant}/homescreen-manifest` 사용 */
  scope: "/m",
  display: "standalone" as const,
  background_color: chayaMerchantPwaBrand.backgroundColor,
  theme_color: chayaMerchantPwaBrand.themeColor,
  icons: chayaPwaManifestIcons(chayaMerchantPwaBrand.icon),
  lang: "ko",
  orientation: "portrait" as const,
};

/** 홈 화면 바로가기 — 점주 `/m` 전용 manifest */
export async function GET() {
  return NextResponse.json(MANIFEST, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
