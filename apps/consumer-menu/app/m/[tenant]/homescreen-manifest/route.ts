import { NextResponse } from "next/server";

import {
  chayaMerchantPwaBrand,
  chayaPwaManifestIcons,
} from "@/lib/pwa/chaya-pwa-brand";

type RouteParams = { params: Promise<{ tenant: string }> };

/** 매장별 홈 화면 추가 — 시작 URL을 홈(대시보드)으로 고정 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { tenant } = await params;
  const slug = tenant.trim();
  const startUrl = `/m/${encodeURIComponent(slug)}/dashboard`;

  return NextResponse.json(
    {
      name: "CHAYA 점주",
      short_name: "CHAYA 점주",
      description: "매장 주문·메뉴·매출 관리",
      start_url: startUrl,
      scope: `/m/${encodeURIComponent(slug)}/`,
      display: "standalone",
      background_color: chayaMerchantPwaBrand.backgroundColor,
      theme_color: chayaMerchantPwaBrand.themeColor,
      icons: chayaPwaManifestIcons(chayaMerchantPwaBrand.icon),
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
