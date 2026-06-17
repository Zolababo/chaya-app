import Link from "next/link";
import { AlertTriangle, ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "warning" | "urgent";

type Props = {
  href: string;
  title: string;
  description?: string;
  actionLabel?: string;
  tone?: Tone;
  icon?: LucideIcon;
  ariaLabel?: string;
  external?: boolean;
  children?: ReactNode;
};

const TONE_CLASS: Record<Tone, string> = {
  warning:
    "rounded-2xl border border-red-200/70 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20",
  urgent:
    "rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3.5 shadow-lg shadow-red-500/25 active:opacity-90",
};

export function MerchantCalloutLink({
  href,
  title,
  description,
  actionLabel = "바로가기",
  tone = "warning",
  icon: Icon = AlertTriangle,
  ariaLabel,
  external,
  children,
}: Props) {
  const urgent = tone === "urgent";
  const inner = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            urgent ? "bg-white/20 text-white" : "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400",
          ].join(" ")}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p
            className={[
              "text-sm font-bold",
              urgent ? "text-white" : "text-red-700 dark:text-red-300",
            ].join(" ")}
          >
            {title}
          </p>
          {description ? (
            <p
              className={[
                "mt-0.5 text-xs",
                urgent ? "text-white/80" : "text-zinc-600 dark:text-zinc-400",
              ].join(" ")}
            >
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </div>
      <span
        className={[
          "flex shrink-0 items-center gap-0.5 text-xs font-bold",
          urgent ? "text-white/80" : "text-red-600 dark:text-red-400",
        ].join(" ")}
      >
        {actionLabel}
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
    </>
  );

  const className = ["flex items-center justify-between gap-3 transition", TONE_CLASS[tone]].join(" ");

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel ?? title}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel ?? title}>
      {inner}
    </Link>
  );
}
