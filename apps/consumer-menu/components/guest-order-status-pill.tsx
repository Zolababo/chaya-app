"use client";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { orderStatusLabelForLocale } from "@/lib/i18n/order-status-for-locale";
import { isActiveOrderStatus } from "@/lib/consumer/order-status-visual";

type Props = {
  status: string;
  className?: string;
};

const PILL_CLASS: Record<string, string> = {
  pending:
    "bg-chaya-primary/10 text-chaya-primary dark:bg-orange-950/40 dark:text-orange-300",
  accepted:
    "bg-chaya-primary/10 text-chaya-primary dark:bg-orange-950/40 dark:text-orange-300",
  preparing: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  ready: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  completed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200",
};

export function GuestOrderStatusPill({ status, className = "" }: Props) {
  const { locale } = useConsumerLocale();
  const code = status.trim().toLowerCase();
  const label = orderStatusLabelForLocale(code, locale);
  const pillClass = PILL_CLASS[code] ?? PILL_CLASS.pending;
  const blink = isActiveOrderStatus(code);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ${pillClass} ${className}`.trim()}
      role="status"
    >
      <span
        className={`size-1.5 rounded-full bg-current ${blink ? "animate-pulse" : ""}`}
        aria-hidden
      />
      {label}
    </span>
  );
}
