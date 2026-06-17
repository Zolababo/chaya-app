import type { MetadataRoute } from "next";

/** PWA가 아니라도 모바일 브라우저·홈 화면 추가 시 이름·테마 힌트용 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CHAYA 메뉴",
    short_name: "CHAYA",
    description:
      "홈 화면 추가 시 시작 주소는 manifest의 start_url이 아니라, 추가할 때 연 페이지(예: /m/login, /t/demo)를 쓰도록 start_url을 두지 않았습니다. 루트(/)는 손님 데모 메뉴로 열립니다.",
    display: "browser",
    background_color: "#fafaf9",
    theme_color: "#c4613a",
    lang: "ko",
  };
}
