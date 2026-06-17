/** DB `tenant_tables.table_code` · 주문 `table_no` 와 동일 규칙 (1~3자리 숫자). */
export const TENANT_TABLE_CODE_MAX = 30;

/** 저장·QR용: 1, 01, 12, 120 */
export const TENANT_TABLE_CODE_RE = /^[0-9]{1,3}$/;

export type NormalizeTableCodeResult =
  | { ok: true; code: string }
  | { ok: false; reason: "empty" | "format" | "too_long" };

/** 저장·표시용 — 1~99는 01~99 */
export function canonicalTableCode(digits: string): string | null {
  const t = digits.trim();
  if (!TENANT_TABLE_CODE_RE.test(t)) return null;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < 1 || n > 999) return null;
  return n <= 99 ? String(n).padStart(2, "0") : String(n);
}

/** QR·주문 검증 — canonical + 레거시(한 자리) 순으로 조회 */
export function tableCodeLookupVariants(raw: string): string[] {
  const canonical = canonicalTableCode(raw);
  if (!canonical) return [];
  const n = Number.parseInt(canonical, 10);
  const unpadded = String(n);
  if (unpadded === canonical) return [canonical];
  return [canonical, unpadded];
}

export function normalizeTableCode(raw: string): NormalizeTableCodeResult {
  const t = raw.trim();
  if (!t) return { ok: false, reason: "empty" };
  if (t.length > TENANT_TABLE_CODE_MAX) return { ok: false, reason: "too_long" };
  if (!TENANT_TABLE_CODE_RE.test(t)) return { ok: false, reason: "format" };

  const code = canonicalTableCode(t);
  if (!code) return { ok: false, reason: "format" };
  return { ok: true, code };
}

export function tableCodeFormatHintKo(): string {
  return "1~99는 01·02처럼 두 자리로 저장돼요 (100 이상은 100, 101…)";
}

/** 목록에서 활성 테이블 찾기 (레거시 한 자리 코드 호환) */
export function matchActiveTableCode(
  items: { table_code: string; is_active: boolean }[],
  raw: string,
): string | null {
  const norm = normalizeTableCode(raw);
  if (!norm.ok) return null;
  const variants = new Set(tableCodeLookupVariants(raw));
  const row = items.find((t) => t.is_active && variants.has(t.table_code));
  return row?.table_code ?? null;
}
