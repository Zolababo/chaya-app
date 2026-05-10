import Link from "next/link";

import { MerchantOrderStatusSubmit } from "@/components/merchant-order-status-submit";
import { MerchantPendingDeltaNotice } from "@/components/merchant-pending-delta-notice";
import { MerchantPreviewBanner } from "@/components/merchant-preview-banner";
import { MerchantSubnav } from "@/components/merchant-subnav";
import { OrderStatusRefresh } from "@/components/order-status-refresh";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import {
  countMerchantPendingOrders,
  listOrdersForMerchant,
} from "@/lib/orders/list-orders-for-merchant";
import {
  isMerchantOrderStatus,
  MERCHANT_ORDER_STATUSES,
} from "@/lib/orders/merchant-status-constants";
import { orderStatusLabel } from "@/lib/orders/order-status-label";

import { updateOrderStatusFromForm } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ e?: string; ok?: string; status?: string }>;
};

function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "bad_input":
      return "요청 값이 올바르지 않습니다.";
    case "no_service":
      return "서버에 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.";
    case "db":
      return "상태 저장에 실패했습니다. DB 권한·RLS·컬럼을 확인해 주세요.";
    case "no_menus_access":
      return "메뉴 관리는 소장(OWNER) 계정만 사용할 수 있습니다.";
    default:
      return "처리 중 오류가 났습니다.";
  }
}

function successMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "status_saved":
      return "주문 상태를 저장했습니다.";
    case "no_change":
      return "선택한 상태가 기존과 같아 저장하지 않았습니다.";
    default:
      return null;
  }
}

function minutesSince(createdAt: string): number {
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return 0;
  const diffMs = Date.now() - t;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 60000);
}

export default async function MerchantOrdersPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const { e, ok, status: statusParam } = await searchParams;
  const rawFilter = typeof statusParam === "string" ? statusParam.trim() : "";
  const statusFilter = isMerchantOrderStatus(rawFilter) ? rawFilter : null;

  const { role } = await requireMerchantForTenant(tenant);

  const [list, allOrdersForSummary, pendingCount] = await Promise.all([
    listOrdersForMerchant(tenant, statusFilter),
    statusFilter ? listOrdersForMerchant(tenant) : Promise.resolve(null),
    countMerchantPendingOrders(tenant),
  ]);
  const errMsg = errorMessage(e);
  const okMsg = successMessage(ok);
  const tEnc = encodeURIComponent(tenant);
  const filterHref = (s: string | null) =>
    s ? `/m/${tEnc}/orders?status=${encodeURIComponent(s)}` : `/m/${tEnc}/orders`;
  const chip = (active: boolean) =>
    [
      "inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors",
      active
        ? "bg-chaya-primary text-chaya-on-primary shadow-sm"
        : "border border-chaya-border bg-chaya-surface text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900",
    ].join(" ");
  const summaryRows = !list.ok
    ? []
    : statusFilter
      ? allOrdersForSummary && allOrdersForSummary.ok
        ? allOrdersForSummary.rows
        : []
      : list.rows;
  const activeRows = summaryRows.filter((row) =>
    ["pending", "accepted", "preparing", "ready"].includes(row.status),
  );
  const preparingRows = summaryRows.filter((row) => ["accepted", "preparing"].includes(row.status));
  const readyRows = summaryRows.filter((row) => row.status === "ready");
  const totalActiveSales = activeRows.reduce((sum, row) => sum + row.total_price, 0);

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 py-8">
      <header className="mb-8 border-b border-chaya-border pb-4 dark:border-zinc-700">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Merchant</p>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-bold">주문 큐 — {tenant}</h1>
          {pendingCount != null && pendingCount > 0 ? (
            <span
              className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white tabular-nums dark:bg-red-500"
              aria-label={`대기 중인 주문 ${pendingCount}건`}
            >
              대기 {pendingCount}건
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          손님 화면:{" "}
          <Link className="font-medium text-chaya-primary underline-offset-2 hover:underline" href={`/t/${tenant}`}>
            /t/{tenant}
          </Link>
        </p>
      </header>

      <MerchantPreviewBanner tenantSlug={tenant} />

      <MerchantSubnav tenant={tenant} pendingOrderCount={pendingCount} canManageMenus={role === "owner"} />

      <div className="mb-6">
        <OrderStatusRefresh />
      </div>

      <MerchantPendingDeltaNotice tenantSlug={tenant} pendingCount={pendingCount} />

      {list.ok ? (
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="주문 요약">
          <article className="rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">신규 주문</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-chaya-primary">
              {summaryRows.filter((row) => row.status === "pending").length}
            </p>
          </article>
          <article className="rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              조리 진행중
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {preparingRows.length}
            </p>
          </article>
          <article className="rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              진행 주문 매출
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {totalActiveSales.toLocaleString("ko-KR")}원
            </p>
          </article>
        </section>
      ) : null}

      {list.ok ? (
        <section className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3" aria-label="상태 보드">
          <article className="rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <h2 className="mb-3 flex items-center justify-between text-base font-semibold">
              <span>신규</span>
              <span className="rounded-full bg-chaya-primary px-2 py-0.5 text-xs font-bold text-white">
                {summaryRows.filter((row) => row.status === "pending").length}
              </span>
            </h2>
            <div className="space-y-2">
              {summaryRows
                .filter((row) => row.status === "pending")
                .slice(0, 3)
                .map((row) => (
                  <div key={row.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                    <p className="font-semibold">{row.table_no ?? "테이블 미지정"}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{minutesSince(row.created_at)}분 전 접수</p>
                  </div>
                ))}
              {summaryRows.filter((row) => row.status === "pending").length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">신규 주문이 없습니다.</p>
              ) : null}
            </div>
          </article>
          <article className="rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <h2 className="mb-3 flex items-center justify-between text-base font-semibold">
              <span>조리중</span>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-white dark:bg-zinc-200 dark:text-zinc-900">
                {preparingRows.length}
              </span>
            </h2>
            <div className="space-y-2">
              {preparingRows.slice(0, 3).map((row) => (
                <div key={row.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                  <p className="font-semibold">{row.table_no ?? "테이블 미지정"}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{orderStatusLabel(row.status)}</p>
                </div>
              ))}
              {preparingRows.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">조리중인 주문이 없습니다.</p>
              ) : null}
            </div>
          </article>
          <article className="rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <h2 className="mb-3 flex items-center justify-between text-base font-semibold">
              <span>서빙 대기</span>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                {readyRows.length}
              </span>
            </h2>
            <div className="space-y-2">
              {readyRows.slice(0, 3).map((row) => (
                <div key={row.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                  <p className="font-semibold">{row.table_no ?? "테이블 미지정"}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{minutesSince(row.created_at)}분 경과</p>
                </div>
              ))}
              {readyRows.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">서빙 대기 주문이 없습니다.</p>
              ) : null}
            </div>
          </article>
        </section>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2" aria-label="주문 상태 필터">
        <Link href={filterHref(null)} className={chip(statusFilter == null)}>
          전체
        </Link>
        {MERCHANT_ORDER_STATUSES.map((s) => (
          <Link key={s} href={filterHref(s)} className={chip(statusFilter === s)}>
            {orderStatusLabel(s)}
          </Link>
        ))}
      </div>

      {errMsg ? (
        <p
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
        >
          {errMsg}
        </p>
      ) : null}
      {okMsg ? (
        <p
          role="status"
          aria-live="polite"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
        >
          {okMsg}
        </p>
      ) : null}

      {!list.ok ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {list.message}
        </p>
      ) : list.rows.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          {statusFilter ? "이 상태의 주문이 없습니다." : "최근 주문이 없습니다."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-chaya-border dark:border-zinc-700">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-chaya-border bg-chaya-surface dark:border-zinc-700 dark:bg-zinc-950">
              <tr>
                <th className="px-3 py-2 font-semibold">시간</th>
                <th className="px-3 py-2 font-semibold">테이블</th>
                <th className="px-3 py-2 font-semibold">합계</th>
                <th className="px-3 py-2 font-semibold">상태</th>
                <th className="px-3 py-2 font-semibold">손님 링크</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chaya-border dark:divide-zinc-800">
              {list.rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="px-3 py-2 tabular-nums text-zinc-600 dark:text-zinc-400">
                    {new Date(row.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-3 py-2">{row.table_no ?? "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{row.total_price.toLocaleString("ko-KR")}원</td>
                  <td className="px-3 py-2">
                    <form action={updateOrderStatusFromForm} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="tenant_slug" value={tenant} />
                      <input type="hidden" name="order_id" value={row.id} />
                      <input type="hidden" name="current_status" value={row.status} />
                      {statusFilter ? <input type="hidden" name="filter_status" value={statusFilter} /> : null}
                      <select
                        name="status"
                        defaultValue={row.status}
                        className="rounded-lg border border-chaya-border bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                        aria-label={`주문 ${row.id.slice(0, 8)} 상태`}
                      >
                        {MERCHANT_ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {orderStatusLabel(s)}
                          </option>
                        ))}
                      </select>
                      <MerchantOrderStatusSubmit
                        confirmMessage={`주문 ${row.id.slice(0, 8)} 상태를 변경합니다. 계속할까요?`}
                      />
                    </form>
                    {row.guest_note ? (
                      <p className="mt-1 max-w-xs text-xs text-zinc-500 whitespace-pre-wrap">{row.guest_note}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      className="text-chaya-primary underline-offset-2 hover:underline"
                      href={`/t/${encodeURIComponent(tenant)}/orders/${row.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      열기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
