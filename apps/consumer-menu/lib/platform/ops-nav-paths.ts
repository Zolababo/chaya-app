/** CHAYA 플랫폼 관리자(`/ops/*`) 네비 — 추후 독립 네이티브 앱 분리 시 동일 탭 ID 유지 */

export type OpsNavTab = "dashboard" | "stores" | "data" | "revenue" | "settings";

export function opsNavMatch(pathname: string, tab: OpsNavTab): boolean {
  switch (tab) {
    case "dashboard":
      return pathname === "/ops" || pathname === "/ops/dashboard";
    case "stores":
      return pathname.startsWith("/ops/stores");
    case "data":
      return pathname.startsWith("/ops/data");
    case "revenue":
      return pathname.startsWith("/ops/revenue");
    case "settings":
      return (
        pathname.startsWith("/ops/settings") ||
        pathname.startsWith("/ops/merchants") ||
        pathname.startsWith("/ops/audit")
      );
    default:
      return false;
  }
}

export const OPS_CONSOLE_PATH_PREFIXES = [
  "/ops/dashboard",
  "/ops/stores",
  "/ops/data",
  "/ops/revenue",
  "/ops/settings",
  "/ops/search",
  "/ops/merchants",
  "/ops/audit",
] as const;

export function isOpsConsolePath(pathname: string): boolean {
  if (pathname === "/ops") return true;
  return OPS_CONSOLE_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
