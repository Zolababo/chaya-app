"use client";

import Link from "next/link";

import {
  merchantOrdersTabHref,
  merchantOrdersTabLabel,
  type MerchantOrdersTab,
} from "@/lib/merchant/merchant-orders-tab";
import {
  merchantStickyShellClass,
  merchantTabLinkClass,
  merchantTabRowClass,
} from "@/lib/merchant/merchant-tab-chrome";

export type MerchantOrdersTabCounts = {
  pending: number;
  cooking: number;
  ready: number;
  todayPaid: number;
  todayCancelled: number;
};

type Props = {
  tenant: string;
  active: MerchantOrdersTab;
  counts: MerchantOrdersTabCounts;
};

type TabConfig = {
  tab: MerchantOrdersTab;
  getBadge: (c: MerchantOrdersTabCounts) => number;
  badgeClass: (n: number) => string;
};

const TABS: TabConfig[] = [
  {
    tab: "all",
    getBadge: (c) => c.pending + c.cooking + c.ready,
    badgeClass: (n) =>
      n > 0
        ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  },
  {
    tab: "pending",
    getBadge: (c) => c.pending,
    badgeClass: (n) =>
      n > 0
        ? "bg-red-500 text-white animate-[badge-pulse_1.2s_ease_infinite]"
        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
  },
  {
    tab: "cooking",
    getBadge: (c) => c.cooking,
    badgeClass: (n) =>
      n > 0 ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
  },
  {
    tab: "ready",
    getBadge: (c) => c.ready,
    badgeClass: (n) =>
      n > 0 ? "bg-sky-500 text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
  },
  {
    tab: "paid",
    getBadge: (c) => c.todayPaid,
    badgeClass: (n) =>
      n > 0 ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
  },
  {
    tab: "cancelled",
    getBadge: (c) => c.todayCancelled,
    badgeClass: () => "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
  },
];

export function MerchantOrdersTabs({ tenant, active, counts }: Props) {
  return (
    <nav className={merchantStickyShellClass} aria-label="주문 구분">
      <div className={merchantTabRowClass}>
        {TABS.map(({ tab, getBadge, badgeClass }) => {
          const n = getBadge(counts);
          const isActive = tab === active;
          return (
            <Link
              key={tab}
              href={merchantOrdersTabHref(tenant, tab)}
              aria-current={isActive ? "page" : undefined}
              className={merchantTabLinkClass(isActive)}
            >
              {merchantOrdersTabLabel(tab)}
              <span
                className={[
                  "min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums",
                  badgeClass(n),
                ].join(" ")}
              >
                {n}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
