import "server-only";

import { isTableQrTokenConfigured, signStaticTableQr } from "@/lib/security/table-qr-token";
import { getServerSiteBaseUrl } from "@/lib/notifications/site-base-url";

import { buildTableQrEntryPath } from "./consumer-table-url";

/** 테이블 QR·인쇄용 — `/t/{tenant}/qr?table=&tsig=` (만료 없음, 스캔 시 4h 주문 권한 발급). */
export function buildSignedConsumerTableUrl(
  tenant: string,
  tableCode: string,
  siteBase?: string | null,
): string {
  const path = buildTableQrEntryPath(tenant, tableCode);
  const base = (siteBase ?? getServerSiteBaseUrl())?.replace(/\/$/, "") ?? "";
  const url = base ? `${base}${path}` : path;

  if (!isTableQrTokenConfigured()) return url;

  const tsig = signStaticTableQr(tenant, tableCode);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}tsig=${encodeURIComponent(tsig)}`;
}

export function buildSignedConsumerUrlsForTables(
  tenant: string,
  tableCodes: string[],
  siteBase?: string | null,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const code of tableCodes) {
    out[code] = buildSignedConsumerTableUrl(tenant, code, siteBase);
  }
  return out;
}
