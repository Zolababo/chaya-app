import Link from "next/link";

import { MerchantPreviewBanner } from "@/components/merchant-preview-banner";
import { MerchantSubnav } from "@/components/merchant-subnav";
import { OrderStatusRefresh } from "@/components/order-status-refresh";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { listMenusForMerchant } from "@/lib/menus/list-menus-for-merchant";
import {
  countMerchantPendingOrders,
  getMerchantDashboard24hMetrics,
  listOrdersForMerchant,
} from "@/lib/orders/list-orders-for-merchant";
import { orderStatusLabel } from "@/lib/orders/order-status-label";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MerchantDashboardPage({ params }: Props) {
  const { tenant } = await params;
  const { role } = await requireMerchantForTenant(tenant);
  const canManageMenus = role === "owner";

  const [pendingCount, metrics24h, list, menus] = await Promise.all([
    countMerchantPendingOrders(tenant),
    getMerchantDashboard24hMetrics(tenant),
    listOrdersForMerchant(tenant),
    listMenusForMerchant(tenant),
  ]);

  const recentOrders = list.ok ? list.rows.slice(0, 8) : [];
  const menuCount = menus.ok ? menus.items.length : null;

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="mb-8 border-b border-chaya-border pb-4 dark:border-zinc-700">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Merchant</p>
        <h1 className="mt-1 text-2xl font-bold">대시보드 — {tenant}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          최근 24시간 접수 및 대기 현황을 한 곳에서 봅니다. 상세 처리는 주문 큐에서 진행하세요.
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

      {!metrics24h.ok ? (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {metrics24h.message}
        </p>
      ) : (
        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="최근 24시간 요약">
          <article className="rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">신규 대기</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-red-700 dark:text-red-400">
              {pendingCount ?? "—"}
            </p>
            <Link
              href={`/m/${encodeURIComponent(tenant)}/orders?status=pending`}
              className="mt-2 inline-block text-xs font-semibold text-chaya-primary underline-offset-2 hover:underline"
            >
              대기 주문 보기
            </Link>
          </article>
          <article className="rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">24시간 접수 건수</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {metrics24h.orderCount}
            </p>
          </article>
          <article className="rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">24시간 매출 합계</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-400">
              {metrics24h.totalSales.toLocaleString("ko-KR")}원
            </p>
          </article>
          <article className="rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">등록 메뉴</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {menuCount ?? "—"}
            </p>
            {canManageMenus ? (
              <Link
                href={`/m/${encodeURIComponent(tenant)}/menus`}
                className="mt-2 inline-block text-xs font-semibold text-chaya-primary underline-offset-2 hover:underline"
              >
                메뉴 관리
              </Link>
            ) : null}
          </article>
        </section>
      )}

      {!metrics24h.ok ? null : (
        <section className="mb-8 rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
          <h2 className="text-base font-semibold">24시간 상태별 건수</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {Object.entries(metrics24h.byStatus)
              .filter(([, n]) => (n ?? 0) > 0)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([status, cnt]) => (
                <li
                  key={status}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700"
                >
                  {orderStatusLabel(status)} <span className="tabular-nums text-zinc-600 dark:text-zinc-400">{cnt}</span>
                </li>
              ))}
            {Object.keys(metrics24h.byStatus).length === 0 ? (
              <li className="text-sm text-zinc-600 dark:text-zinc-400">최근 24시간 접수된 주문이 없습니다.</li>
            ) : null}
          </ul>
        </section>
      )}

      <section aria-label="최근 주문 미리보기">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">최근 주문 미리보기</h2>
          <Link
            href={`/m/${encodeURIComponent(tenant)}/orders`}
            className="text-sm font-semibold text-chaya-primary underline-offset-2 hover:underline"
          >
            주문 큐 전체 →
          </Link>
        </div>
        {!list.ok ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">{list.message}</p>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">표시할 주문이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-chaya-border rounded-xl border border-chaya-border bg-white dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-950">
            {recentOrders.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="font-mono text-xs text-zinc-500">{row.id.slice(0, 8)}…</span>
                <span className="tabular-nums">{new Date(row.created_at).toLocaleString("ko-KR")}</span>
                <span>{row.table_no ?? "테이블 미지정"}</span>
                <span className="tabular-nums">{row.total_price.toLocaleString("ko-KR")}원</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                  {orderStatusLabel(row.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-zinc-500">주문 목록은 최대 100건까지 불러오며, 위는 그중 최근 8건입니다.</p>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/m/${encodeURIComponent(tenant)}/orders`}
          className="rounded-xl border border-chaya-border bg-white px-4 py-3 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          주문 큐로 이동
        </Link>
        {canManageMenus ? (
          <Link
            href={`/m/${encodeURIComponent(tenant)}/menus`}
            className="rounded-xl border border-chaya-border bg-white px-4 py-3 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            메뉴 관리로 이동
          </Link>
        ) : (
          <Link
            href={`/m/${encodeURIComponent(tenant)}/readiness`}
            className="rounded-xl border border-chaya-border bg-white px-4 py-3 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            운영 체크로 이동
          </Link>
        )}
      </section>
    </div>
  );
}
