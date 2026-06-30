import "server-only";

import {
  issueTableQrTokenExpiry,
  isTableQrTokenConfigured,
  signTableQrToken,
} from "@/lib/security/table-qr-token";
import { getServerSiteBaseUrl } from "@/lib/notifications/site-base-url";

import { buildConsumerTableUrlPath } from "./consumer-table-url";

/** 테이블 QR·인쇄용 — 서명·만료 쿼리 포함 전체 URL */
export function buildSignedConsumerTableUrl(
  tenant: string,
  tableCode: string,
  siteBase?: string | null,
  nowMs = Date.now(),
): string {
  const path = buildConsumerTableUrlPath(tenant, tableCode);
  const base = (siteBase ?? getServerSiteBaseUrl())?.replace(/\/$/, "") ?? "";
  const url = base ? `${base}${path}` : path;

  if (!isTableQrTokenConfigured()) return url;

  const exp = issueTableQrTokenExpiry(nowMs);
  const sig = signTableQrToken(tenant, tableCode, exp);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}exp=${exp}&sig=${encodeURIComponent(sig)}`;
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
