import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_HOURS = 4;
const GATE_COOKIE = "chaya_table_order_gate";

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

export function tableOrderGateTtlMs(): number {
  const raw = process.env.CONSUMER_TABLE_QR_TOKEN_TTL_HOURS?.trim();
  const hours = raw ? Number(raw) : DEFAULT_TTL_HOURS;
  if (!Number.isFinite(hours) || hours <= 0) return DEFAULT_TTL_HOURS * 60 * 60 * 1000;
  return Math.min(168, hours) * 60 * 60 * 1000;
}

function hmacBase64Url(message: string): string {
  const secret = tokenSecret();
  if (!secret) throw new Error("table_qr_token_secret_missing");
  return createHmac("sha256", secret).update(message).digest("base64url");
}

function safeEqualStrings(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** 인쇄 QR용 — 테이블 식별만 (만료 없음, 재인쇄는 시크릿 로테이션 시). */
export function signStaticTableQr(tenant: string, tableCode: string): string {
  return hmacBase64Url(`static|${tenant.trim()}|${tableCode.trim()}`);
}

export function verifyStaticTableQr(tenant: string, tableCode: string, tsig: string): boolean {
  if (!isTableQrTokenConfigured()) return true;
  const sig = tsig.trim();
  if (!sig) return false;
  try {
    return safeEqualStrings(signStaticTableQr(tenant, tableCode), sig);
  } catch {
    return false;
  }
}

export type MintedTableOrderGate = {
  cookieName: typeof GATE_COOKIE;
  value: string;
  maxAgeSec: number;
};

/** QR 스캔(입장) 시점부터 TTL — HttpOnly 쿠키 값. */
export function mintTableOrderGate(
  tenant: string,
  tableCode: string,
  nowMs = Date.now(),
): MintedTableOrderGate {
  const slug = tenant.trim();
  const code = tableCode.trim();
  const iatSec = Math.floor(nowMs / 1000);
  const ttlMs = tableOrderGateTtlMs();
  const expSec = Math.floor((nowMs + ttlMs) / 1000);
  const body = `${slug}|${code}|${iatSec}|${expSec}`;
  const value = `${body}.${hmacBase64Url(`gate|${body}`)}`;
  return {
    cookieName: GATE_COOKIE,
    value,
    maxAgeSec: Math.max(60, Math.ceil(ttlMs / 1000)),
  };
}

export type TableOrderGateVerifyResult =
  | { ok: true }
  | { ok: false; code: "table_qr_invalid" | "table_qr_expired" };

export function verifyTableOrderGate(
  cookieValue: string | null | undefined,
  tenant: string,
  tableCode: string,
  nowMs = Date.now(),
): TableOrderGateVerifyResult {
  if (!isTableQrTokenConfigured()) return { ok: true };

  const raw = cookieValue?.trim() ?? "";
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return { ok: false, code: "table_qr_invalid" };

  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = hmacBase64Url(`gate|${body}`);
  if (!safeEqualStrings(sig, expected)) {
    return { ok: false, code: "table_qr_invalid" };
  }

  const parts = body.split("|");
  if (parts.length !== 4) return { ok: false, code: "table_qr_invalid" };
  const [slug, code, , expRaw] = parts;
  const expSec = Number(expRaw);
  if (slug !== tenant.trim() || code !== tableCode.trim()) {
    return { ok: false, code: "table_qr_invalid" };
  }
  if (!Number.isFinite(expSec) || expSec * 1000 <= nowMs) {
    return { ok: false, code: "table_qr_expired" };
  }
  return { ok: true };
}

export { GATE_COOKIE as TABLE_ORDER_GATE_COOKIE };
