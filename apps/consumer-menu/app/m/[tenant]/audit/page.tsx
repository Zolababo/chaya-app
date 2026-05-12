import Link from "next/link";

import { MerchantPreviewBanner } from "@/components/merchant-preview-banner";
import { MerchantSubnav } from "@/components/merchant-subnav";
import { OrderStatusRefresh } from "@/components/order-status-refresh";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import {
  listMerchantAuditEvents,
  merchantAuditActionLabel,
  MERCHANT_AUDIT_ACTION_FILTERS,
} from "@/lib/merchant/list-merchant-audit-events";
import { countMerchantPendingOrders } from "@/lib/orders/list-orders-for-merchant";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ page?: string; action?: string }>;
};

function formatDetail(detail: Record<string, unknown>): string {
  try {
    const s = JSON.stringify(detail, null, 0);
    if (s.length <= 400) return s;
    return `${s.slice(0, 400)}…`;
  } catch {
    return "{}";
  }
}

function auditQuerySuffix(page: number, action: string | null): string {
  const q = new URLSearchParams();
  if (page > 1) q.set("page", String(page));
  if (action) q.set("action", action);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export default async function MerchantAuditPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  const pageParam = typeof sp.page === "string" ? sp.page : undefined;
  const actionParam = typeof sp.action === "string" ? sp.action : undefined;

  const { role } = await requireMerchantForTenant(tenant);
  const canManageMenus = role === "owner";

  const supabase = await createSupabaseServerClient();
  const user = supabase ? await resolveServerUser(supabase) : null;

  const [pendingCount, audit] = await Promise.all([
    countMerchantPendingOrders(tenant),
    listMerchantAuditEvents({ tenantSlug: tenant, page: pageParam, action: actionParam }),
  ]);

  const tEnc = encodeURIComponent(tenant);

  const actionFilter =
    actionParam &&
    MERCHANT_AUDIT_ACTION_FILTERS.some((o) => o.value === actionParam && o.value !== "")
      ? actionParam
      : null;

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="mb-6 border-b border-chaya-border pb-4 dark:border-zinc-700">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Merchant</p>
        <h1 className="mt-1 text-2xl font-bold">활동 기록 — {tenant}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          주문 상태·메뉴 변경 등 콘솔에서 수행한 작업을 시간순으로 봅니다. (세션 + RLS로 본인 매장만 조회)
        </p>
      </header>

      <MerchantPreviewBanner tenantSlug={tenant} />

      <MerchantSubnav tenant={tenant} pendingOrderCount={pendingCount} canManageMenus={canManageMenus} />

      <div className="mb-6">
        <OrderStatusRefresh />
      </div>

      <section className="mb-6 rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="audit-action" className="mb-1 block text-xs font-semibold text-zinc-500">
              유형
            </label>
            <select
              id="audit-action"
              name="action"
              defaultValue={actionFilter ?? ""}
              className="min-h-[44px] rounded-lg border border-chaya-border bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            >
              {MERCHANT_AUDIT_ACTION_FILTERS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="min-h-[44px] rounded-lg bg-chaya-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            적용
          </button>
        </form>
      </section>

      {!audit.ok ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
        >
          {audit.message}
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            총 <span className="font-semibold tabular-nums">{audit.total}</span>건 · 페이지{" "}
            <span className="font-semibold tabular-nums">{audit.page}</span> /{" "}
            <span className="font-semibold tabular-nums">
              {Math.max(1, Math.ceil(audit.total / audit.pageSize))}
            </span>
          </p>

          {audit.rows.length === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              기록이 없습니다. 주문 상태를 바꾸거나 메뉴를 수정하면 여기에 쌓입니다.
            </p>
          ) : (
            <ul className="space-y-3">
              {audit.rows.map((row) => {
                const isSelf = user?.id === row.actor_user_id;
                const actorLabel = isSelf ? "나" : `${row.actor_user_id.slice(0, 8)}…`;
                return (
                  <li
                    key={row.id}
                    className="rounded-xl border border-chaya-border bg-white p-4 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {merchantAuditActionLabel(row.action)}
                      </span>
                      <time
                        className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400"
                        dateTime={row.created_at}
                      >
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString("ko-KR", {
                              dateStyle: "short",
                              timeStyle: "medium",
                            })
                          : "—"}
                      </time>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      수행자: <span className="font-mono">{actorLabel}</span>
                    </p>
                    <pre className="mt-2 max-h-32 overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                      {formatDetail(row.detail)}
                    </pre>
                  </li>
                );
              })}
            </ul>
          )}

          {audit.total > audit.pageSize ? (
            <nav className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold" aria-label="페이지">
              {audit.page > 1 ? (
                <Link
                  className="rounded-lg border border-chaya-border px-4 py-2 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                  href={`/m/${tEnc}/audit${auditQuerySuffix(audit.page - 1, actionFilter)}`}
                >
                  이전
                </Link>
              ) : (
                <span className="text-zinc-400">이전</span>
              )}
              {audit.page < Math.ceil(audit.total / audit.pageSize) ? (
                <Link
                  className="rounded-lg border border-chaya-border px-4 py-2 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                  href={`/m/${tEnc}/audit${auditQuerySuffix(audit.page + 1, actionFilter)}`}
                >
                  다음
                </Link>
              ) : (
                <span className="text-zinc-400">다음</span>
              )}
            </nav>
          ) : null}
        </>
      )}

      <p className="mt-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <Link href={`/m/${tEnc}/dashboard`} className="font-semibold text-chaya-primary underline-offset-2 hover:underline">
          대시보드로
        </Link>
      </p>
    </div>
  );
}
