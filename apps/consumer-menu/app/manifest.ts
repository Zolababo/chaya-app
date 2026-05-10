import type { MetadataRoute } from "next";

/** PWA가 아니라도 모바일 브라우저·홈 화면 추가 시 이름·테마 힌트용 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CHAYA 메뉴",
    short_name: "CHAYA",
    description: "매장 주문 메뉴판 · 점주·운영 콘솔",
    start_url: "/",
    display: "browser",
    background_color: "#fcf9f8",
    theme_color: "#a43700",
    lang: "ko",
  };
}
