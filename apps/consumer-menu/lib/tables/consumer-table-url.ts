import { getServerSiteBaseUrl } from "@/lib/notifications/site-base-url";

/** 손님 테이블 QR 경로 (`?table=` 만, 서명 없음). */
export function buildConsumerTableUrlPath(tenant: string, tableCode: string): string {
  const slug = tenant.trim();
  const code = tableCode.trim();
  return `/t/${encodeURIComponent(slug)}?table=${encodeURIComponent(code)}`;
}

/** @deprecated 테이블 QR·주문 검증에는 `buildSignedConsumerTableUrl`(서버) 사용 */
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
