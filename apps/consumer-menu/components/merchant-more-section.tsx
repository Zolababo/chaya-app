import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { chayaSurfaceCardClass } from "@/components/menu-list-styles";

export type MerchantMoreRow =
  | {
      kind: "link";
      href: string;
      label: string;
      description?: string;
      icon?: LucideIcon;
      badge?: string;
      disabled?: boolean;
    }
  | {
      kind: "custom";
      key: string;
      node: ReactNode;
    };

type SectionProps = {
  title: string;
  description?: string;
  rows: MerchantMoreRow[];
};

function MoreLinkRow({
  href,
  label,
  description,
  icon: Icon,
  badge,
  disabled,
}: Extract<MerchantMoreRow, { kind: "link" }>) {
  const inner = (
    <>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        aria-hidden
      >
        {Icon ? <Icon className="h-5 w-5" strokeWidth={2} /> : <span className="text-lg">•</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">{label}</span>
          {badge ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {badge}
            </span>
          ) : null}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {description}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-sm font-bold text-chaya-primary" aria-hidden>
        →
      </span>
    </>
  );

  if (disabled) {
    return (
      <div className="flex min-h-[56px] cursor-not-allowed items-center gap-3 px-4 py-3 opacity-50">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="flex min-h-[56px] items-center gap-3 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/80"
    >
      {inner}
    </Link>
  );
}

export function MerchantMoreSection({ title, description, rows }: SectionProps) {
  return (
    <section className={`mb-3 overflow-hidden ${chayaSurfaceCardClass}`} aria-label={title}>
      <div className="border-b border-chaya-border/60 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      <ul>
        {rows.map((row, index) => (
          <li
            key={row.kind === "link" ? row.href : row.key}
            className={index > 0 ? "border-t border-chaya-border/50 dark:border-zinc-800" : undefined}
          >
            {row.kind === "link" ? <MoreLinkRow {...row} /> : row.node}
          </li>
        ))}
      </ul>
    </section>
  );
}
