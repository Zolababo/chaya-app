/** priorCompletedCount = 이번 건 이전 결제완료 횟수 */
export type GuestVisitTier = "first" | "returning" | "regular";

/** 활성 단골 — 최근 90일 내 결제완료 횟수 기준 */
export const GUEST_ACTIVE_REGULAR_WINDOW_DAYS = 90;
export const GUEST_ACTIVE_REGULAR_MIN_VISITS = 3;

/** 주문 큐 한 줄 빈도 표시 */
export const GUEST_QUEUE_DISPLAY_WINDOW_DAYS = 30;

export const GUEST_FREQUENCY_WINDOWS = [7, 30, 90] as const;
export type GuestFrequencyWindowDays = (typeof GUEST_FREQUENCY_WINDOWS)[number];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type GuestFrequencyCounts = {
  visitsLast7: number;
  visitsLast30: number;
  visitsLast90: number;
};

export function emptyGuestFrequencyCounts(): GuestFrequencyCounts {
  return { visitsLast7: 0, visitsLast30: 0, visitsLast90: 0 };
}

export function msSinceWindowDays(windowDays: number, nowMs = Date.now()): number {
  return nowMs - windowDays * MS_PER_DAY;
}

export function countCompletedInWindow(
  completedAts: string[],
  windowDays: number,
  nowMs = Date.now(),
): number {
  const sinceMs = msSinceWindowDays(windowDays, nowMs);
  let count = 0;
  for (const at of completedAts) {
    const ms = Date.parse(at);
    if (Number.isFinite(ms) && ms >= sinceMs) count += 1;
  }
  return count;
}

export function buildGuestFrequencyCounts(
  completedAts: string[],
  nowMs = Date.now(),
): GuestFrequencyCounts {
  return {
    visitsLast7: countCompletedInWindow(completedAts, 7, nowMs),
    visitsLast30: countCompletedInWindow(completedAts, 30, nowMs),
    visitsLast90: countCompletedInWindow(completedAts, 90, nowMs),
  };
}

export function isActiveRegularGuest(visitsIn90Days: number): boolean {
  return visitsIn90Days >= GUEST_ACTIVE_REGULAR_MIN_VISITS;
}

export function guestVisitTierFromHistory(
  priorCompletedCount: number,
  priorCompletedAts: string[],
  nowMs = Date.now(),
): GuestVisitTier {
  if (priorCompletedCount <= 0) return "first";
  const visits90 = countCompletedInWindow(priorCompletedAts, GUEST_ACTIVE_REGULAR_WINDOW_DAYS, nowMs);
  if (isActiveRegularGuest(visits90)) return "regular";
  return "returning";
}

export function guestVisitNumberFromPrior(priorCompletedCount: number): number {
  return Math.max(1, priorCompletedCount + 1);
}

export function guestVisitTierLabel(tier: GuestVisitTier): string {
  switch (tier) {
    case "first":
      return "첫 방문";
    case "returning":
      return "재방문";
    case "regular":
      return "단골";
  }
}

export function guestFrequencyCountForWindow(
  counts: GuestFrequencyCounts,
  windowDays: GuestFrequencyWindowDays,
): number {
  switch (windowDays) {
    case 7:
      return counts.visitsLast7;
    case 30:
      return counts.visitsLast30;
    case 90:
      return counts.visitsLast90;
  }
}
