import Link from "next/link";

import { MerchantOrderStatusSubmit } from "@/components/merchant-order-status-submit";
import { MerchantPendingDeltaNotice } from "@/components/merchant-pending-delta-notice";
import { MerchantPreviewBanner } from "@/components/merchant-preview-banner";
import { MerchantSubnav } from "@/components/merchant-subnav";
import { OrderStatusRefresh } from "@/components/order-status-refresh";
import { resolveMerchantToken } from "@/lib/merchant/resolve-merchant-token";
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
  searchParams: Promise<{ token?: string; e?: string; ok?: string; status?: string }>;
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

export default async function MerchantOrdersPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const { token, e, ok, status: statusParam } = await searchParams;
  const rawFilter = typeof statusParam === "string" ? statusParam.trim() : "";
  const statusFilter = isMerchantOrderStatus(rawFilter) ? rawFilter : null;

  if (!(await resolveMerchantToken(token))) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <h1 className="text-xl font-bold">접근할 수 없습니다</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-mono">MERCHANT_ORDERS_TOKEN</span> 과 같은 값을{" "}
          <span className="font-mono">?token=</span> 으로 한 번 열면 브라우저에 안전하게 저장됩니다. 쿠키를 지웠다면
          다시 붙여 주세요.
        </p>
      </div>
    );
  }

  const [list, pendingCount] = await Promise.all([
    listOrdersForMerchant(tenant, statusFilter),
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

      <MerchantSubnav tenant={tenant} pendingOrderCount={pendingCount} />

      <div className="mb-6">
        <OrderStatusRefresh />
      </div>

      <MerchantPendingDeltaNotice tenantSlug={tenant} pendingCount={pendingCount} />

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
