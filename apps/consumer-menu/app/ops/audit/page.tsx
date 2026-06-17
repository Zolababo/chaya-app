import Link from "next/link";

import { OpsConsoleFrame } from "@/components/ops/ops-console-frame";
import { MERCHANT_AUDIT_ACTION_FILTERS, merchantAuditActionLabel } from "@/lib/merchant/list-merchant-audit-events";
import { listOpsAuditEvents, OPS_AUDIT_CSV_MAX_ROWS } from "@/lib/platform/list-ops-audit-events";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    page?: string;
    action?: string;
    from?: string;
    to?: string;
    tenant?: string;
  }>;
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

function auditQuerySuffix(
  page: number,
  action: string | null,
  fromYmd: string | null,
  toYmd: string | null,
  tenantSlug: string | null,
): string {
  const q = new URLSearchParams();
  if (page > 1) q.set("page", String(page));
  if (action) q.set("action", action);
  if (fromYmd) q.set("from", fromYmd);
  if (toYmd) q.set("to", toYmd);
  if (tenantSlug) q.set("tenant", tenantSlug);
  const s = q.toString();
  return s ? `?${s}` : "";
}

function buildExportHref(
  action: string | null,
  fromYmd: string | null,
  toYmd: string | null,
  tenantSlug: string | null,
): string {
  const q = new URLSearchParams();
  if (action) q.set("action", action);
  if (fromYmd) q.set("from", fromYmd);
  if (toYmd) q.set("to", toYmd);
  if (tenantSlug) q.set("tenant", tenantSlug);
  const s = q.toString();
  return `/ops/audit/export${s ? `?${s}` : ""}`;
}

export default async function OpsAuditPage({ searchParams }: Props) {
  await requirePlatformOperator("/ops/audit");
  const sp = await searchParams;

  const pageParam = typeof sp.page === "string" ? sp.page : undefined;
  const actionParam = typeof sp.action === "string" ? sp.action : undefined;
  const fromParam = typeof sp.from === "string" ? sp.from : undefined;
  const toParam = typeof sp.to === "string" ? sp.to : undefined;
  const tenantParam = typeof sp.tenant === "string" ? sp.tenant : undefined;

  const audit = await listOpsAuditEvents({
    tenantSlug: tenantParam,
    page: pageParam,
    action: actionParam,
    fromYmd: fromParam,
    toYmd: toParam,
  });

  const actionFilter =
    actionParam &&
    MERCHANT_AUDIT_ACTION_FILTERS.some((o) => o.value === actionParam && o.value !== "")
      ? actionParam
      : null;

  const fromYmd = (fromParam ?? "").trim() || null;
  const toYmd = (toParam ?? "").trim() || null;
  const tenantSlug = (tenantParam ?? "").trim().toLowerCase() || null;

  const exportHref = buildExportHref(actionFilter, fromYmd, toYmd, tenantSlug);

  return (
    <OpsConsoleFrame
      wide
      title="감사 로그 (전 매장)"
      subtitle="점주 콘솔에서 기록된 변경 사항을 매장별로 조회합니다. platform_operators RLS 정책이 필요합니다."
    >
      <section className="mb-6 rounded-xl border border-chaya-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <form method="get" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <label htmlFor="ops-audit-tenant" className="mb-1 block text-xs font-semibold text-zinc-500">
                매장 슬러그 (선택)
              </label>
              <input
                id="ops-audit-tenant"
                name="tenant"
                type="text"
                placeholder="비우면 전체"
                defaultValue={tenantSlug ?? ""}
                className="w-full min-h-[44px] rounded-lg border border-chaya-border px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="ops-audit-from" className="mb-1 block text-xs font-semibold text-zinc-500">
                시작일 (KST)
              </label>
              <input
                id="ops-audit-from"
                name="from"
                type="date"
                defaultValue={fromYmd ?? ""}
                className="min-h-[44px] rounded-lg border border-chaya-border px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="ops-audit-to" className="mb-1 block text-xs font-semibold text-zinc-500">
                종료일 (KST)
              </label>
              <input
                id="ops-audit-to"
                name="to"
                type="date"
                defaultValue={toYmd ?? ""}
                className="min-h-[44px] rounded-lg border border-chaya-border px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="ops-audit-action" className="mb-1 block text-xs font-semibold text-zinc-500">
                유형
              </label>
              <select
                id="ops-audit-action"
                name="action"
                defaultValue={actionFilter ?? ""}
                className="min-h-[44px] rounded-lg border border-chaya-border px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
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
          </div>
        </form>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          날짜를 비우면 전체 기간입니다. 한쪽만 있으면 그날 하루로 봅니다. 기간은 최대 120일입니다.
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <a
            href={exportHref}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-chaya-border px-4 py-2 font-semibold text-chaya-primary hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
          >
            CSV 다운로드
          </a>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            최대 {OPS_AUDIT_CSV_MAX_ROWS.toLocaleString("ko-KR")}건 · 초과 시{" "}
            <span className="font-mono">X-Audit-Export-Truncated</span>
          </span>
        </p>
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
              조건에 맞는 기록이 없습니다. DB에{" "}
              <span className="font-mono">merchant_audit_events_select_platform_operator</span> 정책이 적용됐는지
              확인해 주세요.
            </p>
          ) : (
            <ul className="space-y-3">
              {audit.rows.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-chaya-border bg-white p-4 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      <span className="text-chaya-primary dark:text-orange-400">{row.tenant_slug}</span> ·{" "}
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
                    수행자: <span className="font-mono">{row.actor_user_id.slice(0, 8)}…</span>
                  </p>
                  <pre className="mt-2 max-h-32 overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                    {formatDetail(row.detail)}
                  </pre>
                </li>
              ))}
            </ul>
          )}

          {audit.total > audit.pageSize ? (
            <nav className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold" aria-label="페이지">
              {audit.page > 1 ? (
                <Link
                  className="rounded-lg border border-chaya-border px-4 py-2 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                  href={`/ops/audit${auditQuerySuffix(audit.page - 1, actionFilter, fromYmd, toYmd, tenantSlug)}`}
                >
                  이전
                </Link>
              ) : (
                <span className="text-zinc-400">이전</span>
              )}
              {audit.page < Math.ceil(audit.total / audit.pageSize) ? (
                <Link
                  className="rounded-lg border border-chaya-border px-4 py-2 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                  href={`/ops/audit${auditQuerySuffix(audit.page + 1, actionFilter, fromYmd, toYmd, tenantSlug)}`}
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
    </OpsConsoleFrame>
  );
}
