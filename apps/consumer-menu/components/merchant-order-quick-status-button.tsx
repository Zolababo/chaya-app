"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
  tone: "primary" | "neutral" | "danger";
  confirmMessage?: string;
  fullWidth?: boolean;
  compact?: boolean;
};

const toneClass: Record<Props["tone"], string> = {
  primary: "bg-chaya-primary text-chaya-on-primary",
  neutral: "border-2 border-chaya-border bg-white text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100",
  danger: "border-2 border-red-400 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200",
};

export function MerchantOrderQuickStatusButton({
  label,
  tone,
  confirmMessage,
  fullWidth = false,
  compact = false,
}: Props) {
  const { pending } = useFormStatus();
  const sizeClass = compact ? "min-h-[40px] px-3 text-sm" : "min-h-[52px] px-4 text-base";
  const widthClass = fullWidth ? "w-full" : compact ? "" : "flex-1";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex ${widthClass} ${sizeClass} items-center justify-center rounded-xl font-bold disabled:opacity-60 ${toneClass[tone]}`}
      onClick={(e) => {
        if (pending) return;
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending ? "…" : label}
    </button>
  );
}
