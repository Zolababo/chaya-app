import { NextResponse } from "next/server";

import {
  chayaMerchantPwaBrand,
  chayaPwaManifestIcons,
} from "@/lib/pwa/chaya-pwa-brand";

/**
 * 점주 로그인 전용 Web App Manifest.
 * 루트 `app/manifest.ts`는 손님·공통용이라 `start_url`을 `/m/login`으로 두기 어렵고,
 * Android Chrome은 홈 화면 추가 시 이 문서의 manifest를 쓰므로 여기서 시작 URL을 고정합니다.
 */
export function GET() {
  const body = {
    name: "CHAYA 점주",
    short_name: "CHAYA 점주",
    description: "점주 로그인. 홈 화면 아이콘은 /m/login 으로 열립니다.",
    start_url: "/m/login",
    scope: "/",
    display: "browser",
    background_color: chayaMerchantPwaBrand.backgroundColor,
    theme_color: chayaMerchantPwaBrand.themeColor,
    icons: chayaPwaManifestIcons(chayaMerchantPwaBrand.icon),
    lang: "ko",
  };

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
