"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  /** a11y: 활성 시 원형 버튼을 primary 색으로 채움 */
  variant?: "default" | "a11y";
  children: ReactNode;
};

/** 헤더 툴바 아이콘 — 44px 터치, 테두리로 메뉴 배경과 구분 */
export const consumerHeaderIconClass = "size-6 shrink-0" as const;

export const consumerHeaderIconStroke = 2.25 as const;

const a11yRingPulseClass =
  "pointer-events-none absolute inset-0 rounded-full border-2 border-chaya-primary motion-reduce:animate-none animate-[consumer-a11y-ring-pulse_2.4s_ease-out_infinite]";

export function ConsumerHeaderIconButton({
  active = false,
  variant = "default",
  className = "",
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-sm transition-colors";
  const tone =
    variant === "a11y"
      ? active
        ? "relative z-10 border-chaya-primary bg-chaya-primary text-chaya-on-primary shadow-md hover:bg-chaya-primary-hover"
        : "border-zinc-300/90 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
      : active
        ? "border-chaya-primary/40 bg-chaya-primary/15 text-chaya-primary dark:border-orange-700/55 dark:bg-orange-950/60 dark:text-orange-200"
        : "border-zinc-300/90 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white";

  const button = (
    <button type="button" className={`${base} ${tone} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );

  if (variant === "a11y" && active) {
    return (
      <span className="relative inline-flex size-11 shrink-0 items-center justify-center">
        <span
          className="pointer-events-none absolute -inset-0.5 rounded-full border-2 border-chaya-primary motion-reduce:opacity-90 motion-safe:animate-[consumer-a11y-ring-breathe_2.4s_ease-in-out_infinite]"
          aria-hidden
        />
        <span className={`${a11yRingPulseClass} motion-reduce:hidden`} aria-hidden />
        <span
          className={`${a11yRingPulseClass} motion-reduce:hidden [animation-delay:1.2s]`}
          aria-hidden
        />
        {button}
      </span>
    );
  }

  return button;
}
