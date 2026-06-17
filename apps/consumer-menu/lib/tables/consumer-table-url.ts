import { getServerSiteBaseUrl } from "@/lib/notifications/site-base-url";

/** 손님 메뉴 QR에 넣을 전체 URL (또는 경로만). */
export function buildConsumerTableUrl(
  tenant: string,
  tableCode: string,
  siteBase?: string | null,
): string {
  const slug = tenant.trim();
  const code = tableCode.trim();
  const path = `/t/${encodeURIComponent(slug)}?table=${encodeURIComponent(code)}`;
  const base = (siteBase ?? getServerSiteBaseUrl())?.replace(/\/$/, "") ?? "";
  return base ? `${base}${path}` : path;
}

export function merchantTableQrImagePath(tenant: string, tableCode: string): string {
  return `/m/${encodeURIComponent(tenant.trim())}/tables/qr/${encodeURIComponent(tableCode.trim())}.png`;
}
