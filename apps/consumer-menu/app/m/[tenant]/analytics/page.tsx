import Link from "next/link";

import { MerchantPreviewBanner } from "@/components/merchant-preview-banner";
import { MerchantSubnav } from "@/components/merchant-subnav";
import { OrderStatusRefresh } from "@/components/order-status-refresh";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { listMenusForMerchant } from "@/lib/menus/list-menus-for-merchant";
import { countMerchantPendingOrders, getMerchantOrderMetricsSinceDays } from "@/lib/orders/list-orders-for-merchant";
import { orderStatusLabel } from "@/lib/orders/order-status-label";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ days?: string }>;
};

function parseDays(raw: string | undefined): 7 | 30 {
  if (raw === "30") return 30;
  return 7;
}

export default async function MerchantAnalyticsPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const { days: daysParam } = await searchParams;
  const days = parseDays(typeof daysParam === "string" ? daysParam : undefined);

  const { role } = await requireMerchantForTenant(tenant);
  const canManageMenus = role === "owner";

  const [pendingCount, metrics, menus] = await Promise.all([
    countMerchantPendingOrders(tenant),
    getMerchantOrderMetricsSinceDays(tenant, days),
    listMenusForMerchant(tenant),
  ]);

  const menuCount = menus.ok ? menus.items.length : null;

  const tEnc = encodeURIComponent(tenant);
  const href7 = `/m/${tEnc}/analytics`;
  const href30 = `/m/${tEnc}/analytics?days=30`;

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="mb-6 border-b border-chaya-border pb-4 dark:border-zinc-700">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Merchant</p>
        <h1 className="mt-1 text-2xl font-bold">기간 실적 — {tenant}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          최근 {days}일간 접수된 주문 건수와 매출 합계입니다. (주문 시각 기준, 롤링)
        </p>
        <p className="mt-1 text-sm">
          손님 메뉴판:{" "}
          <Link className="font-medium text-chaya-primary underline-offset-2 hover:underline" href={`/t/${tenant}`}>
            /t/{tenant}
          </Link>
        </p>
      </header>

      <MerchantPreviewBanner tenantSlug={tenant} />

      <MerchantSubnav tenant={tenant} pendingOrderCount={pendingCount} canManageMenus={canManageMenus} />

      <div className="mb-6">
        <OrderStatusRefresh />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={href7}
          className={
            days === 7
              ? "inline-flex min-h-[44px] items-center rounded-full bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary"
              : "inline-flex min-h-[44px] items-center rounded-full border border-chaya-border bg-chaya-surface px-4 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          }
        >
          최근 7일
        </Link>
        <Link
          href={href30}
          className={
            days === 30
              ? "inline-flex min-h-[44px] items-center rounded-full bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary"
              : "inline-flex min-h-[44px] items-center rounded-full border border-chaya-border bg-chaya-surface px-4 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          }
        >
          최근 30일
        </Link>
      </div>

      {!metrics.ok ? (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {metrics.message}
        </p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">주문 건수</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {metrics.orderCount.toLocaleString("ko-KR")}
            </p>
          </div>
          <div className="rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">매출 합계</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-chaya-primary dark:text-orange-400">
              {metrics.totalSales.toLocaleString("ko-KR")}원
            </p>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">상태별 건수</p>
            <ul className="mt-3 space-y-2 text-sm">
              {Object.keys(metrics.byStatus).length === 0 ? (
                <li className="text-zinc-500 dark:text-zinc-400">해당 기간 주문이 없습니다.</li>
              ) : (
                Object.entries(metrics.byStatus)
                  .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                  .map(([st, n]) => (
                    <li key={st} className="flex justify-between gap-4 tabular-nums">
                      <span>{orderStatusLabel(st)}</span>
                      <span className="font-semibold">{(n ?? 0).toLocaleString("ko-KR")}</span>
                    </li>
                  ))
              )}
            </ul>
          </div>
        </section>
      )}

      {menuCount != null ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          등록 메뉴 {menuCount}개 · 메뉴명·카테고리 수정은{" "}
          <Link className="font-medium text-chaya-primary underline-offset-2 hover:underline" href={`/m/${tEnc}/menus`}>
            메뉴 관리
          </Link>
          에서 할 수 있습니다.
        </p>
      ) : null}
    </div>
  );
}
