import { getServerSiteBaseUrl } from "@/lib/notifications/site-base-url";

/** QR 스캔 입장 경로 (주문 권한 쿠키 발급 후 메뉴로 리다이렉트). */
export function buildTableQrEntryPath(tenant: string, tableCode: string): string {
  const slug = tenant.trim();
  const code = tableCode.trim();
  return `/t/${encodeURIComponent(slug)}/qr?table=${encodeURIComponent(code)}`;
}

/** 손님 메뉴 경로 (`?table=` 만 — URL 복사용, 주문 권한 없음). */
export function buildConsumerTableUrlPath(tenant: string, tableCode: string): string {
  const slug = tenant.trim();
  const code = tableCode.trim();
  return `/t/${encodeURIComponent(slug)}?table=${encodeURIComponent(code)}`;
}

/** @deprecated 인쇄·QR에는 `buildSignedConsumerTableUrl` 사용 */
export function buildConsumerTableUrl(
  tenant: string,
  tableCode: string,
  siteBase?: string | null,
): string {
  const path = buildConsumerTableUrlPath(tenant, tableCode);
  const base = (siteBase ?? getServerSiteBaseUrl())?.replace(/\/$/, "") ?? "";
  return base ? `${base}${path}` : path;
}

export function merchantTableQrImagePath(tenant: string, tableCode: string): string {
  return `/m/${encodeURIComponent(tenant.trim())}/tables/qr/${encodeURIComponent(tableCode.trim())}.png`;
}
