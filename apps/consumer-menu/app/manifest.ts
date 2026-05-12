import type { MetadataRoute } from "next";

/** PWA가 아니라도 모바일 브라우저·홈 화면 추가 시 이름·테마 힌트용 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CHAYA 메뉴",
    short_name: "CHAYA",
    description:
      "기본 시작은 손님 메뉴판(/)입니다. 점주앱 바로가기는 브라우저에서 /m/login 또는 /m/{가게}/dashboard 를 연 뒤 홈 화면에 추가하세요.",
    start_url: "/",
    display: "browser",
    background_color: "#fcf9f8",
    theme_color: "#a43700",
    lang: "ko",
  };
}
