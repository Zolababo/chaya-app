"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isMerchantMoreRoute } from "@/lib/merchant/merchant-nav-paths";
import {
  merchantMainTabFromPathname,
  merchantMainTabHref,
  type MerchantMainTab,
} from "@/lib/merchant/merchant-main-tab";
import { useMerchantPendingCount } from "@/lib/merchant/merchant-pending-count-context";
import { merchantDesktopSubnavClass } from "@/lib/responsive/chaya-app-shell";

type Props = {
  tenant: string;
  pendingOrderCount?: number | null;
  canManageMenus?: boolean;
};

type NavItem = { href: string; label: string; match: string };

function linkClass(active: boolean, primary?: boolean): string {
  const base = "inline-flex min-h-[40px] items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition";
  if (active) {
    return `${base} bg-chaya-primary text-chaya-on-primary shadow-sm`;
  }
  if (primary) {
    return `${base} text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800`;
  }
  return `${base} text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800`;
}

export function MerchantSubnav({ tenant, pendingOrderCount, canManageMenus = true }: Props) {
  const pathname = usePathname() ?? "";
  const { pendingCount: livePending } = useMerchantPendingCount();
  const resolvedPending = livePending ?? pendingOrderCount;
  const showPending =
    typeof resolvedPending === "number" && resolvedPending > 0 ? resolvedPending : null;

  const activeMainTab = merchantMainTabFromPathname(pathname, tenant);
  const isMainTabActive = (tab: MerchantMainTab) => activeMainTab === tab;

  const primary: NavItem[] = [
    { href: merchantMainTabHref(tenant, "dashboard"), label: "홈", match: "/dashboard" },
    { href: merchantMainTabHref(tenant, "orders"), label: "주문", match: "/orders" },
  ];
  if (canManageMenus) {
    primary.push({ href: merchantMainTabHref(tenant, "menus"), label: "메뉴", match: "/menus" });
  }
  primary.push({ href: merchantMainTabHref(tenant, "analytics"), label: "분석", match: "/analytics" });

  const t = encodeURIComponent(tenant);
  const base = `/m/${t}`;

  const more: NavItem[] = [
    { href: `${base}/more`, label: "더보기", match: "/more" },
    { href: `${base}/tables`, label: "테이블 QR", match: "/tables" },
    { href: `${base}/readiness`, label: "운영 체크", match: "/readiness" },
  ];
  if (canManageMenus) {
    more.push({ href: `${base}/categories`, label: "카테고리", match: "/categories" });
  }
  more.push({ href: `${base}/audit`, label: "활동 기록", match: "/audit" });

  const isMainTabLinkActive = (tab: MerchantMainTab) => isMainTabActive(tab);
  const isMoreLinkActive = (match: string) => pathname.includes(`/m/${tenant}${match}`);
  const moreOpen = isMerchantMoreRoute(pathname, base);

  return (
    <nav className={`mb-6 space-y-2 ${merchantDesktopSubnavClass}`} aria-label="점주 메뉴">
      <div className="flex flex-wrap items-center gap-2">
        {primary.map((item) => {
          const tab =
            item.match === "/dashboard"
              ? "dashboard"
              : item.match === "/orders"
                ? "orders"
                : item.match === "/menus"
                  ? "menus"
                  : "analytics";
          const active = isMainTabLinkActive(tab);
          return (
          <Link
            key={item.href}
            href={item.href}
            scroll={false}
            className={linkClass(active, true)}
            aria-current={active ? "page" : undefined}
          >
            <span>{item.label}</span>
            {item.match === "/orders" && showPending != null ? (
              <span
                className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white tabular-nums dark:bg-red-500"
                aria-label={`대기 중인 주문 ${showPending}건`}
              >
                {showPending}
              </span>
            ) : null}
          </Link>
          );
        })}

        <details className="relative" open={moreOpen || undefined}>
          <summary
            className={`${linkClass(moreOpen)} cursor-pointer list-none marker:content-none`}
          >
            설정
          </summary>
          <div className="absolute left-0 z-20 mt-1 min-w-[11rem] rounded-xl border border-chaya-border bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
            {more.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                  isMoreLinkActive(item.match) ? "text-chaya-primary dark:text-orange-400" : "text-zinc-700 dark:text-zinc-300"
                }`}
                aria-current={isMoreLinkActive(item.match) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </details>

        <form action="/m/logout" method="post" className="ml-auto">
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-500"
            aria-label="로그아웃"
          >
            로그아웃
          </button>
        </form>
      </div>
    </nav>
  );
}
