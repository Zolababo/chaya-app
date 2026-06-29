/** 영업일 — KST + 매출·손님 집계용 `sales_day_cutoff` (기본 04:00). */

export const DEFAULT_SALES_DAY_CUTOFF = "04:00";
export const KST = "Asia/Seoul";

const HM_RE = /^(\d{2}):(\d{2})$/;

export type BusinessDayBounds = {
  /** 영업일 라벨 (YYYY-MM-DD) — 마감 구분 시각 기준 */
  businessDayKey: string;
  /** KST ISO — `[since, until)` */
  sinceIso: string;
  untilIso: string;
  dateLabel: string;
  rangeLabel: string;
};

export function parseHmToMinutes(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const m = HM_RE.exec(raw.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function normalizeHm(raw: string | null | undefined, fallback = DEFAULT_SALES_DAY_CUTOFF): string {
  const min = parseHmToMinutes(raw);
  if (min == null) return fallback;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getSalesDayCutoff(settings: { salesDayCutoff?: string | null }): string {
  return normalizeHm(settings.salesDayCutoff ?? null);
}

function kstDateKey(nowMs: number): string {
  return new Date(nowMs).toLocaleDateString("en-CA", { timeZone: KST });
}

function kstMinutes(nowMs: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(nowMs);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/** YYYY-MM-DD ± days (KST 달력) */
export function addKstDateKey(dateKey: string, deltaDays: number): string {
  const base = new Date(`${dateKey}T12:00:00+09:00`).getTime();
  return new Date(base + deltaDays * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", {
    timeZone: KST,
  });
}

export function businessDayBoundsForKey(
  businessDayKey: string,
  cutoffHm: string,
): BusinessDayBounds {
  const cutoff = normalizeHm(cutoffHm);
  const sinceIso = `${businessDayKey}T${cutoff}:00+09:00`;
  const untilKey = addKstDateKey(businessDayKey, 1);
  const untilIso = `${untilKey}T${cutoff}:00+09:00`;
  const sinceMs = Date.parse(sinceIso);
  const dateLabel = new Date(sinceMs).toLocaleDateString("ko-KR", {
    timeZone: KST,
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const rangeLabel = formatBusinessDayRangeLabel(businessDayKey, untilKey, cutoff);
  return { businessDayKey, sinceIso, untilIso, dateLabel, rangeLabel };
}

export function businessDayKeyAt(nowMs: number, cutoffHm: string): string {
  const cutoffMin = parseHmToMinutes(normalizeHm(cutoffHm)) ?? 4 * 60;
  const dateKey = kstDateKey(nowMs);
  if (kstMinutes(nowMs) < cutoffMin) return addKstDateKey(dateKey, -1);
  return dateKey;
}

export function getCurrentBusinessDayBounds(
  cutoffHm: string,
  nowMs = Date.now(),
): BusinessDayBounds {
  const key = businessDayKeyAt(nowMs, cutoffHm);
  return businessDayBoundsForKey(key, cutoffHm);
}

export function getPreviousBusinessDayBounds(
  cutoffHm: string,
  nowMs = Date.now(),
): BusinessDayBounds {
  const current = getCurrentBusinessDayBounds(cutoffHm, nowMs);
  const prevKey = addKstDateKey(current.businessDayKey, -1);
  return businessDayBoundsForKey(prevKey, cutoffHm);
}

export function getLastBusinessDaysWindow(
  dayCount: number,
  cutoffHm: string,
  nowMs = Date.now(),
): BusinessDayBounds & { dayKeys: string[] } {
  const n = Math.max(1, Math.min(90, Math.floor(dayCount)));
  const current = getCurrentBusinessDayBounds(cutoffHm, nowMs);
  const dayKeys: string[] = [];
  let key = current.businessDayKey;
  for (let i = 0; i < n; i++) {
    dayKeys.unshift(key);
    key = addKstDateKey(key, -1);
  }
  const sinceIso = businessDayBoundsForKey(dayKeys[0]!, cutoffHm).sinceIso;
  return {
    ...current,
    sinceIso,
    dayKeys,
  };
}

export function businessDayBoundsForRangeKeys(
  fromKey: string,
  toKey: string,
  cutoffHm: string,
): BusinessDayBounds {
  const from = fromKey <= toKey ? fromKey : toKey;
  const to = fromKey <= toKey ? toKey : fromKey;
  const sinceIso = businessDayBoundsForKey(from, cutoffHm).sinceIso;
  const untilIso = businessDayBoundsForKey(to, cutoffHm).untilIso;
  const dateLabel =
    from === to
      ? businessDayBoundsForKey(from, cutoffHm).dateLabel
      : `${from.slice(5)} ~ ${to.slice(5)}`;
  const rangeLabel = formatBusinessDayRangeLabel(from, addKstDateKey(to, 1), normalizeHm(cutoffHm));
  return {
    businessDayKey: to,
    sinceIso,
    untilIso,
    dateLabel,
    rangeLabel,
  };
}

export function formatBusinessDayRangeLabel(
  fromDayKey: string,
  untilDayKeyExclusive: string,
  cutoffHm: string,
): string {
  const cutoff = normalizeHm(cutoffHm);
  const fmt = (key: string) => {
    const [y, mo, d] = key.split("-").map(Number) as [number, number, number];
    return `${mo}/${d}`;
  };
  return `${fmt(fromDayKey)} ${cutoff} ~ ${fmt(untilDayKeyExclusive)} ${cutoff}`;
}

export function businessDayKeyFromIso(iso: string, cutoffHm: string): string | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return businessDayKeyAt(t, cutoffHm);
}

export function buildBusinessDayChartKeys(
  sinceIso: string,
  untilIso: string,
  cutoffHm: string,
): { key: string; label: string; fullLabel: string }[] {
  const cutoff = normalizeHm(cutoffHm);
  const startKey = businessDayKeyFromIso(sinceIso, cutoff);
  const endMs = Date.parse(untilIso) - 1;
  const endKey = businessDayKeyAt(endMs, cutoff);
  if (!startKey || !endKey) return [];

  const out: { key: string; label: string; fullLabel: string }[] = [];
  let key = startKey;
  for (let guard = 0; guard < 400 && key <= endKey; guard++) {
    const [y, mo, d] = key.split("-").map(Number) as [number, number, number];
    const label = `${mo}/${d}`;
    const wd = new Date(`${key}T12:00:00+09:00`).toLocaleDateString("ko-KR", {
      timeZone: KST,
      weekday: "short",
    });
    out.push({ key, label, fullLabel: `${label}(${wd})` });
    key = addKstDateKey(key, 1);
  }
  return out;
}
