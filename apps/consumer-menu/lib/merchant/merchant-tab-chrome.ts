import { chayaAppShellBleedClass } from "@/lib/responsive/chaya-app-shell";

/** 점주 4탭 SPA — sticky 탭 바 공통 스타일 */

export const merchantStickyShellClass = [
  "sticky top-[var(--chaya-merchant-sticky-top)] z-20",
  chayaAppShellBleedClass,
  "border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95",
].join(" ");

export const merchantTabRowClass =
  "flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function merchantTabLinkClass(isActive: boolean): string {
  return [
    "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-[2.5px] px-3.5 py-3 text-[13px] font-semibold transition-colors",
    isActive
      ? "border-chaya-primary text-chaya-primary dark:border-orange-400 dark:text-orange-400"
      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300",
  ].join(" ");
}

export function merchantTabCountBadgeClass(opts: {
  isActive: boolean;
  /** 품절·대기 등 주의가 필요한 카운트 */
  alert?: boolean;
  alertPulse?: boolean;
}): string {
  const base = "min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums";
  if (opts.alert && opts.alertPulse) {
    return `${base} animate-[badge-pulse_1.2s_ease_infinite] bg-red-500 text-white`;
  }
  if (opts.alert && !opts.isActive) {
    return `${base} bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300`;
  }
  if (opts.isActive) {
    return `${base} bg-chaya-primary text-chaya-on-primary dark:bg-orange-600 dark:text-white`;
  }
  return `${base} bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500`;
}
