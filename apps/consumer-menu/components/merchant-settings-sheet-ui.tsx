"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

const ICON_ACCENT: Record<string, string> = {
  kakao: "bg-[#FEE500] text-[#3B1E00]",
  open: "bg-[#E6F7EE] text-[#00A85A]",
  green: "bg-[#E6F7EE] text-[#00A85A]",
  closed: "bg-[#FEF2F2] text-[#EF4444]",
  orange: "bg-[#FFFBEB] text-[#D97706]",
  blue: "bg-[#EBF1FF] text-[#1A6FFF]",
  purple: "bg-[#F5F3FF] text-[#7C3AED]",
  gray: "bg-[#F2F3F5] text-[#4B5563]",
  default: "bg-[#F2F3F5] text-[#4B5563]",
};

export function MerchantSettingsIconBox({
  icon: Icon,
  accent = "default",
}: {
  icon: LucideIcon;
  accent?: keyof typeof ICON_ACCENT | "default";
}) {
  const boxClass = ICON_ACCENT[accent] ?? ICON_ACCENT.default;

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${boxClass}`}
      aria-hidden
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
    </span>
  );
}

export function MerchantSettingsChevron() {
  return (
    <ChevronRight className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={2} aria-hidden />
  );
}

export function MerchantSettingsSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="pt-4 first:pt-0">
      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.07em] text-[#9CA3AF]">
        {label}
      </p>
      <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {children}
      </div>
    </section>
  );
}

export function MerchantSettingsRow({
  href,
  onClick,
  icon,
  title,
  sub,
  trailing,
  disabled,
}: {
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  title: string;
  sub?: string;
  trailing?: ReactNode;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-[11px]">
        {icon}
        <span className="min-w-0">
          <span className="block text-[15px] font-bold text-[#111827] dark:text-zinc-50">{title}</span>
          {sub ? (
            <span className="mt-0.5 block max-w-[220px] truncate text-xs font-medium text-[#9CA3AF]">
              {sub}
            </span>
          ) : null}
        </span>
      </span>
      {trailing ? <span className="flex shrink-0 items-center gap-1.5">{trailing}</span> : null}
    </>
  );

  const className =
    "flex w-full min-h-[52px] items-center justify-between gap-3 bg-white px-4 py-3 text-left transition active:bg-[#F2F3F5] dark:bg-zinc-950 dark:active:bg-zinc-900";

  if (disabled) {
    return <div className={`${className} cursor-default opacity-50`}>{inner}</div>;
  }

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {inner}
    </button>
  );
}

export function MerchantSettingsStaticRow({
  icon,
  title,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 bg-white px-4 py-3 dark:bg-zinc-950">
      <span className="flex min-w-0 flex-1 items-center gap-[11px]">
        {icon}
        <span className="text-[15px] font-bold text-[#111827] dark:text-zinc-50">{title}</span>
      </span>
      {trailing ? <span className="flex shrink-0 items-center gap-1.5">{trailing}</span> : null}
    </div>
  );
}

export function MerchantSettingsRowDivider() {
  return <div className="h-px bg-[#F3F4F6] dark:bg-zinc-800" aria-hidden />;
}

export function MerchantSettingsToggle({
  on,
  onToggle,
  disabled,
  ariaLabel,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
      className={[
        "relative h-[30px] w-[50px] shrink-0 rounded-full border-0 p-0 transition-colors duration-200",
        on ? "bg-[#1A9E5C]" : "bg-[#D1D5DB]",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none absolute top-[3px] h-6 w-6 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.22)] transition-[left] duration-200",
          on ? "left-[23px]" : "left-[3px]",
        ].join(" ")}
      />
    </button>
  );
}

export function MerchantSettingsBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "open" | "closed" | "warn" | "muted" | "new";
}) {
  const cls = {
    open: "bg-[#E6F7EE] text-[#00A85A]",
    closed: "bg-[#FEF2F2] text-[#EF4444]",
    warn: "bg-[#FFFBEB] text-[#D97706]",
    muted: "bg-[#F2F3F5] text-[#9CA3AF]",
    new: "bg-[#F2F3F5] text-[#9CA3AF]",
  }[tone];
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>{children}</span>;
}

export function MerchantSettingsChip({
  children,
  linked,
}: {
  children: ReactNode;
  linked: boolean;
}) {
  return (
    <span
      className={[
        "rounded-full px-2 py-0.5 text-[10px] font-bold",
        linked ? "bg-[#E6F7EE] text-[#00A85A]" : "bg-[#FEF2F2] text-[#EF4444]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
