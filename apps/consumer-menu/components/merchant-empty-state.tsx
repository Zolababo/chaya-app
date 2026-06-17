import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { chayaSurfaceCardClass } from "@/components/menu-list-styles";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
};

/** 점주 탭 — Lucide + 짧은 문구 (이모지 대신). */
export function MerchantEmptyState({ icon: Icon, title, description, children }: Props) {
  return (
    <div className={`px-6 py-12 text-center ${chayaSurfaceCardClass}`}>
      <span
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
        aria-hidden
      >
        <Icon className="h-6 w-6" strokeWidth={2} />
      </span>
      <p className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
