import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_HOURS = 4;

function tokenSecret(): string | null {
  const raw =
    process.env.CONSUMER_TABLE_QR_TOKEN_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  return raw.length >= 16 ? raw : null;
}

export function isTableQrTokenConfigured(): boolean {
  return tokenSecret() != null;
}

function tableQrTokenTtlMs(): number {
  const raw = process.env.CONSUMER_TABLE_QR_TOKEN_TTL_HOURS?.trim();
  const hours = raw ? Number(raw) : DEFAULT_TTL_HOURS;
  if (!Number.isFinite(hours) || hours <= 0) return DEFAULT_TTL_HOURS * 60 * 60 * 1000;
  return Math.min(168, hours) * 60 * 60 * 1000;
}

function signPayload(tenant: string, tableCode: string, expSec: number): string {
  const secret = tokenSecret();
  if (!secret) throw new Error("table_qr_token_secret_missing");
  return createHmac("sha256", secret)
    .update(`${tenant.trim()}|${tableCode.trim()}|${expSec}`)
    .digest("base64url");
}

export function issueTableQrTokenExpiry(nowMs = Date.now()): number {
  return Math.floor((nowMs + tableQrTokenTtlMs()) / 1000);
}

export function signTableQrToken(tenant: string, tableCode: string, expSec: number): string {
  return signPayload(tenant, tableCode, expSec);
}

export type TableQrTokenVerifyResult =
  | { ok: true }
  | { ok: false; code: "table_qr_invalid" | "table_qr_expired" };

export function verifyTableQrToken(
  tenant: string,
  tableCode: string,
  expSec: number,
  sig: string,
  nowMs = Date.now(),
): TableQrTokenVerifyResult {
  if (!isTableQrTokenConfigured()) return { ok: true };

  const slug = tenant.trim();
  const code = tableCode.trim();
  const signature = sig.trim();
  if (!slug || !code || !signature || !Number.isFinite(expSec) || expSec <= 0) {
    return { ok: false, code: "table_qr_invalid" };
  }

  if (expSec * 1000 <= nowMs) {
    return { ok: false, code: "table_qr_expired" };
  }

  let expected: string;
  try {
    expected = signPayload(slug, code, expSec);
  } catch {
    return { ok: true };
  }

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, code: "table_qr_invalid" };
    }
  } catch {
    return { ok: false, code: "table_qr_invalid" };
  }

  return { ok: true };
}
