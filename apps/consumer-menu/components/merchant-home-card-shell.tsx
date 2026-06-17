"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, RefreshCw, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";

import { chayaSurfaceCardPaddedClass } from "@/components/menu-list-styles";

export type MerchantHomeCardAccent = "rose" | "emerald" | "amber" | "sky";

const ACCENT_CLASS: Record<MerchantHomeCardAccent, string> = {
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
};

function formatRefreshLabel(d: Date): string {
  return d.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

type ShellProps = {
  title: string;
  icon: LucideIcon;
  accent: MerchantHomeCardAccent;
  collapsedSummary?: string;
  headerMeta?: string;
  defaultOpen?: boolean;
  showRefresh?: boolean;
  children: ReactNode;
};

export function MerchantHomeCardShell({
  title,
  icon: Icon,
  accent,
  collapsedSummary,
  headerMeta,
  defaultOpen = true,
  showRefresh = true,
  children,
}: ShellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [refreshedAt, setRefreshedAt] = useState(() => new Date());

  const onRefresh = useCallback(() => {
    setRefreshedAt(new Date());
    router.refresh();
  }, [router]);

  return (
    <section className={`mb-3 ${chayaSurfaceCardPaddedClass} py-3`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ACCENT_CLASS[accent]}`}
            aria-hidden
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="min-w-0 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </span>
          {!open && collapsedSummary ? (
            <span className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {collapsedSummary}
            </span>
          ) : null}
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          {headerMeta && open ? (
            <span className="mr-1 hidden max-w-[7rem] truncate text-[11px] font-medium text-zinc-500 sm:inline dark:text-zinc-400">
              {headerMeta}
            </span>
          ) : null}
          {showRefresh ? (
            <>
              <span className="hidden text-[11px] font-medium text-zinc-500 tabular-nums sm:inline dark:text-zinc-400">
                {formatRefreshLabel(refreshedAt)}
              </span>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="새로고침"
              >
                <RefreshCw className="h-4 w-4" strokeWidth={2} />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label={open ? "접기" : "펼치기"}
          >
            {open ? (
              <ChevronUp className="h-5 w-5" strokeWidth={2} />
            ) : (
              <ChevronDown className="h-5 w-5" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

/** 카드 본문 — 라벨·값·링크 행 (메뉴·매장). */
export function MerchantHomeLinkRow({
  label,
  value,
  href,
  highlight,
  subLabel,
}: {
  label: string;
  value: string;
  href: string;
  highlight?: boolean;
  subLabel?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex min-h-[48px] items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition",
        highlight
          ? "bg-amber-50 ring-1 ring-amber-200/80 hover:bg-amber-100 dark:bg-amber-950/40 dark:ring-amber-800"
          : "bg-zinc-50/80 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900",
      ].join(" ")}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
        {subLabel ? (
          <span className="mt-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-500">
            {subLabel}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-sm font-bold tabular-nums text-chaya-primary">{value}</span>
    </Link>
  );
}

/** 운영·매출용 숫자 타일. */
export function MerchantHomeMetricTile({
  label,
  count,
  href,
  highlight,
  hint,
  footerHint,
  centered = false,
  compact = false,
}: {
  label: string;
  count: number;
  href: string;
  highlight?: boolean;
  hint?: string;
  footerHint?: string;
  /** 운영 카드 — 라벨·숫자·보조 문구 가운데 정렬 */
  centered?: boolean;
  /** 하단 3칸 등 — 글자·높이 축소 */
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex flex-col justify-center rounded-xl px-2.5 py-2 transition",
        compact ? "min-h-[60px]" : "min-h-[68px] px-3 py-2.5",
        centered ? "items-center text-center" : "",
        highlight
          ? "bg-rose-50 ring-2 ring-rose-200 hover:bg-rose-100 dark:bg-rose-950/50 dark:ring-rose-800"
          : "bg-zinc-50/80 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900",
      ].join(" ")}
    >
      <span
        className={[
          compact ? "text-[10px] leading-tight" : "text-xs",
          "font-semibold",
          highlight ? "text-rose-800 dark:text-rose-200" : "text-zinc-600 dark:text-zinc-400",
        ].join(" ")}
      >
        {label}
      </span>
      <span
        className={[
          "mt-0.5 font-bold tabular-nums leading-tight",
          compact ? "text-xl" : "text-2xl",
          highlight ? "text-rose-900 dark:text-rose-100" : "text-zinc-900 dark:text-zinc-50",
        ].join(" ")}
      >
        {count}
        <span className="ml-0.5 text-sm font-semibold">건</span>
      </span>
      {hint ? (
        <span className="mt-0.5 text-[11px] font-medium text-zinc-500">{hint}</span>
      ) : null}
      {footerHint ? (
        <span className="mt-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-500">{footerHint}</span>
      ) : null}
    </Link>
  );
}
