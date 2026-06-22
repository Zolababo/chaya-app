import { NextResponse } from "next/server";

const MANIFEST = {
  name: "CHAYA 점주",
  short_name: "CHAYA 점주",
  description: "매장 주문·메뉴·매출 관리",
  start_url: "/m",
  scope: "/m",
  display: "standalone" as const,
  background_color: "#F2F3F5",
  theme_color: "#c4613a",
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
