"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { merchantMainTabFromPathname, merchantMainTabHref } from "@/lib/merchant/merchant-main-tab";
import { useMerchantPendingCount } from "@/lib/merchant/merchant-pending-count-context";

type Props = {
  tenant: string;
};

/** 주문 탭 밖에서 대기 건수가 있을 때만 — 얇은 안내 스트립 (기존 레이아웃 위에 additive) */
export function MerchantPendingAttentionStrip({ tenant }: Props) {
  const pathname = usePathname() ?? "";
  const { pendingCount } = useMerchantPendingCount();
  const onOrders = merchantMainTabFromPathname(pathname, tenant) === "orders";

  if (onOrders || pendingCount == null || pendingCount <= 0) return null;

  const ordersHref = merchantMainTabHref(tenant, "orders");
  const label =
    pendingCount === 1 ? "대기 주문 1건" : `대기 주문 ${pendingCount}건`;

  return (
    <div className="sticky top-[var(--merchant-header-offset,0px)] z-30 border-b border-red-200/80 bg-red-50/95 px-4 py-2 backdrop-blur dark:border-red-900/50 dark:bg-red-950/90">
      <Link
        href={ordersHref}
        className="flex min-h-[40px] items-center justify-between gap-3 rounded-lg outline-none ring-chaya-primary ring-offset-2 ring-offset-red-50 focus-visible:ring-2 dark:ring-offset-red-950"
      >
        <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-red-800 dark:text-red-200">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden />
          <span className="truncate">{label} — 주문 큐에서 확인</span>
        </span>
        <span className="shrink-0 text-xs font-extrabold text-red-600 dark:text-red-300">열기 →</span>
      </Link>
    </div>
  );
}
