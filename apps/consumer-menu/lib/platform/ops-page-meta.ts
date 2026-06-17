/** PC 탑바 제목·브레드크럼 — 경로 기준 */

export type OpsPageMeta = {
  title: string;
  breadcrumb: string;
};

export function getOpsPageMeta(pathname: string): OpsPageMeta {
  if (pathname === "/ops" || pathname === "/ops/dashboard") {
    return { title: "대시보드", breadcrumb: "CHAYA Admin / 홈" };
  }
  if (pathname.startsWith("/ops/stores")) {
    return { title: "매장 관리", breadcrumb: "CHAYA Admin / 매장" };
  }
  if (pathname.startsWith("/ops/data")) {
    return { title: "분석", breadcrumb: "CHAYA Admin / 분석" };
  }
  if (pathname.startsWith("/ops/revenue")) {
    return { title: "수익 파이프라인", breadcrumb: "CHAYA Admin / 수익" };
  }
  if (pathname.startsWith("/ops/settings")) {
    return { title: "시스템 설정", breadcrumb: "CHAYA Admin / 설정" };
  }
  if (pathname.startsWith("/ops/merchants")) {
    return { title: "점주 멤버십", breadcrumb: "CHAYA Admin / 점주" };
  }
  if (pathname.startsWith("/ops/audit")) {
    return { title: "감사 로그", breadcrumb: "CHAYA Admin / 감사" };
  }
  if (pathname.startsWith("/ops/search")) {
    return { title: "검색", breadcrumb: "CHAYA Admin / 검색" };
  }
  return { title: "CHAYA Admin", breadcrumb: "CHAYA Admin" };
}
