const ACTIVE = new Set(["pending", "accepted", "preparing", "ready"]);

/** 티켓 카드 왼쪽 띠. */
export function orderStatusStripeClass(status: string): string {
  switch (status) {
    case "pending":
      return "border-l-rose-500";
    case "accepted":
      return "border-l-amber-500";
    case "preparing":
      return "border-l-orange-500";
    case "ready":
      return "border-l-emerald-500";
    case "completed":
      return "border-l-zinc-400";
    case "cancelled":
      return "border-l-zinc-300 dark:border-l-zinc-600";
    default:
      return "border-l-zinc-300";
  }
}

export function orderWaitMinutesClass(minutes: number, status: string): string {
  if (!ACTIVE.has(status)) return "text-zinc-500 dark:text-zinc-400";
  if (minutes >= 25) return "font-bold text-red-600 dark:text-red-400";
  if (minutes >= 15) return "font-semibold text-amber-600 dark:text-amber-400";
  return "text-zinc-600 dark:text-zinc-400";
}
