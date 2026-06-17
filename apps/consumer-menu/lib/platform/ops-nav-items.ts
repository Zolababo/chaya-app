import type { OpsNavTab } from "@/lib/platform/ops-nav-paths";

/** PC 사이드바 · 모바일 하단 1차 탭 */
export const OPS_MAIN_NAV: { id: OpsNavTab; href: string; label: string }[] = [
  { id: "dashboard", href: "/ops/dashboard", label: "대시보드" },
  { id: "stores", href: "/ops/stores", label: "매장 관리" },
  { id: "data", href: "/ops/data", label: "분석" },
  { id: "revenue", href: "/ops/revenue", label: "수익 파이프라인" },
];

export const OPS_PRIMARY_NAV: { id: OpsNavTab; href: string; label: string }[] = [
  ...OPS_MAIN_NAV,
  { id: "settings", href: "/ops/settings", label: "설정" },
];

/** PC 사이드바 2차 링크 (설정 하위) */
export const OPS_SECONDARY_NAV: { href: string; label: string; matchPrefix: string }[] = [
  { href: "/ops/merchants", label: "점주 멤버십", matchPrefix: "/ops/merchants" },
  { href: "/ops/audit", label: "감사 로그", matchPrefix: "/ops/audit" },
];
