/** priorCompletedCount = 이번 건 이전 결제완료 횟수 */
export type GuestVisitTier = "first" | "returning" | "regular";

export const GUEST_REGULAR_MIN_PRIOR = 2;

export function guestVisitTierFromPrior(priorCompletedCount: number): GuestVisitTier {
  if (priorCompletedCount <= 0) return "first";
  if (priorCompletedCount === 1) return "returning";
  return "regular";
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
