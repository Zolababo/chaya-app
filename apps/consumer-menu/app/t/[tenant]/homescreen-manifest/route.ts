import { NextResponse } from "next/server";

import {
  chayaConsumerPwaBrand,
  chayaPwaManifestIcons,
} from "@/lib/pwa/chaya-pwa-brand";

type RouteParams = { params: Promise<{ tenant: string }> };

/** 매장별 손님 홈 화면 추가 — 메뉴판 시작 URL */
export async function GET(_request: Request, { params }: RouteParams) {
  const { tenant } = await params;
  const slug = tenant.trim();
  const enc = encodeURIComponent(slug);
  const startUrl = `/t/${enc}`;

  return NextResponse.json(
    {
      name: "CHAYA 메뉴",
      short_name: "CHAYA",
      description: "매장 메뉴 주문",
      start_url: startUrl,
      scope: `/t/${enc}/`,
      display: "standalone",
      background_color: chayaConsumerPwaBrand.backgroundColor,
      theme_color: chayaConsumerPwaBrand.themeColor,
      icons: chayaPwaManifestIcons(chayaConsumerPwaBrand.icon),
      lang: "ko",
      orientation: "portrait",
    },
    {
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    },
  );
}
