"use client";

import type { ReactNode } from "react";
import { BarChart3, ClipboardList, Home, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

import {
  merchantMainTabFromPathname,
  merchantMainTabHref,
  type MerchantMainTab,
} from "@/lib/merchant/merchant-main-tab";
import {
  prefetchMerchantOrdersLive,
  prefetchMerchantOrdersQueuePane,
} from "@/lib/merchant/merchant-live-prefetch";
import { useMerchantPendingCount } from "@/lib/merchant/merchant-pending-count-context";
import {
  chayaAppShellNavInnerClass,
  merchantCompactNavClass,
} from "@/lib/responsive/chaya-app-shell";

type Props = {
  tenant: string;
  canManageMenus?: boolean;
};

function Tab({
  href,
  active,
  label,
  icon,
  badge,
  onIntentPrefetch,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: ReactNode;
  badge?: number | null;
  onIntentPrefetch: (href: string) => void;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      scroll={false}
      onPointerEnter={() => onIntentPrefetch(href)}
      onTouchStart={() => onIntentPrefetch(href)}
      onFocus={() => onIntentPrefetch(href)}
      className={[
        "relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-1 text-[10px] font-bold sm:text-xs",
        active ? "text-chaya-primary" : "text-zinc-500 dark:text-zinc-400",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative" aria-hidden>
        {icon}
        {badge != null && badge > 0 ? (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span>{label}</span>
    </Link>
  );
}

/** 모바일 점주 — 홈 · 주문 · 메뉴 · 분석 (4탭 SPA 셸) */
export function MerchantBottomNav({ tenant, canManageMenus = true }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { pendingCount } = useMerchantPendingCount();
  const showPending =
    typeof pendingCount === "number" && pendingCount > 0 ? pendingCount : null;

  const activeMainTab = merchantMainTabFromPathname(pathname, tenant);
  const isActive = (tab: MerchantMainTab) => activeMainTab === tab;

  const menuHref = canManageMenus ? merchantMainTabHref(tenant, "menus") : `/t/${encodeURIComponent(tenant)}`;
  const menuActive = canManageMenus ? isActive("menus") : false;

  const prefetchOnIntent = useCallback(
    (href: string) => {
      if (pathname === href) return;
      router.prefetch(href);
      if (href === merchantMainTabHref(tenant, "orders")) {
        prefetchMerchantOrdersLive(tenant, "all");
        prefetchMerchantOrdersQueuePane();
      }
    },
    [pathname, router, tenant],
  );

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-chaya-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 ${merchantCompactNavClass}`}
      aria-label="점주 하단 메뉴"
    >
      <div className={`${chayaAppShellNavInnerClass} chaya-app-shell--merchant flex`}>
        <Tab
          href={merchantMainTabHref(tenant, "dashboard")}
          active={isActive("dashboard")}
          label="홈"
          icon={<Home className="h-6 w-6" strokeWidth={2} />}
          onIntentPrefetch={prefetchOnIntent}
        />
        <Tab
          href={merchantMainTabHref(tenant, "orders")}
          active={isActive("orders")}
          label="주문"
          icon={<ClipboardList className="h-6 w-6" strokeWidth={2} />}
          badge={showPending}
          onIntentPrefetch={prefetchOnIntent}
        />
        <Tab
          href={menuHref}
          active={menuActive}
          label={canManageMenus ? "메뉴" : "손님 메뉴"}
          icon={<UtensilsCrossed className="h-6 w-6" strokeWidth={2} />}
          onIntentPrefetch={prefetchOnIntent}
        />
        <Tab
          href={merchantMainTabHref(tenant, "analytics")}
          active={isActive("analytics")}
          label="분석"
          icon={<BarChart3 className="h-6 w-6" strokeWidth={2} />}
          onIntentPrefetch={prefetchOnIntent}
        />
      </div>
    </nav>
  );
}
