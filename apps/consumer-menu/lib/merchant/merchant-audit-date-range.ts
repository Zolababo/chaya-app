/** Asia/Seoul 달력일(YYYY-MM-DD) 기준으로 `created_at` 필터용 UTC ISO 구간. 한국은 DST 없음. */

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function isValidYmd(s: string): boolean {
  return YMD.test(s.trim()) && !Number.isNaN(Date.parse(`${s.trim()}T00:00:00+09:00`));
}

export function kstMidnightUtcIso(ymd: string): string | null {
  const t = ymd.trim();
  if (!isValidYmd(t)) return null;
  return new Date(`${t}T00:00:00+09:00`).toISOString();
}

export function kstNextMidnightUtcIso(ymd: string): string | null {
  const start = kstMidnightUtcIso(ymd);
  if (!start) return null;
  return new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000).toISOString();
}

export type AuditDateRangeOk = { gteIso: string; ltIso: string; fromYmd: string; toYmd: string };

export type AuditDateFilterResult =
  | { kind: "none" }
  | { kind: "range"; range: AuditDateRangeOk }
  | { kind: "error"; message: string };

const MAX_SPAN_DAYS = 120;

/**
 * 날짜 미입력 → 필터 없음.
 * 한쪽만 있으면 하루 구간으로 본다(시작=끝).
 */
export function resolveMerchantAuditDateFilter(
  fromYmd: string | null | undefined,
  toYmd: string | null | undefined,
): AuditDateFilterResult {
  let f = String(fromYmd ?? "").trim();
  let t = String(toYmd ?? "").trim();
  if (!f && !t) return { kind: "none" };
  if (f && !t) t = f;
  if (!f && t) f = t;

  if (!isValidYmd(f) || !isValidYmd(t)) {
    return { kind: "error", message: "날짜 형식은 YYYY-MM-DD 여야 합니다." };
  }
  if (f > t) {
    return { kind: "error", message: "시작일이 종료일보다 늦을 수 없습니다." };
  }
  const gteIso = kstMidnightUtcIso(f);
  const ltIso = kstNextMidnightUtcIso(t);
  if (!gteIso || !ltIso) {
    return { kind: "error", message: "날짜를 해석할 수 없습니다." };
  }
  const spanMs = new Date(ltIso).getTime() - new Date(gteIso).getTime();
  const spanDays = spanMs / (24 * 60 * 60 * 1000);
  if (spanDays > MAX_SPAN_DAYS) {
    return { kind: "error", message: `기간은 최대 ${MAX_SPAN_DAYS}일까지 선택할 수 있습니다.` };
  }
  return { kind: "range", range: { gteIso, ltIso, fromYmd: f, toYmd: t } };
}
