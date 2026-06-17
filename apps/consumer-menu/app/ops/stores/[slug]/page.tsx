import Link from "next/link";

import { MerchantAnalyticsSummary } from "@/components/merchant-analytics-summary";
import { OpsConsoleFrame, OpsKpiTile, OpsSectionCard } from "@/components/ops/ops-console-frame";
import { OpsDataTable, OpsDataTableBody, OpsDataTableHead } from "@/components/ops/ops-data-table";
import { OpsHealthBreakdownList, OpsStoreHealthBadge } from "@/components/ops/ops-store-health-badge";
import { OpsStoreKakaoAlimtalkCard } from "@/components/ops/ops-store-kakao-alimtalk-card";
import { OpsStoreOpsActionsCard } from "@/components/ops/ops-store-ops-actions-card";
import { getPlatformStoreDetail } from "@/lib/platform/get-platform-store-detail";
import { isOpsOrderResetAllowed } from "@/lib/platform/ops-order-reset-allowlist";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import { fetchTenantStoreSettings } from "@/lib/tenant/tenant-store-settings";
import {
  opsCompactOnlyClass,
  opsDesktopOnlyClass,
  opsStoreDetailColLeftClass,
  opsStoreDetailColRightClass,
  opsStoreDetailKpiGridClass,
  opsStoreDetailLayoutClass,
} from "@/lib/responsive/chaya-ops-shell";
import { getTenantBranding } from "@/lib/tenant/tenant-branding";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; e?: string; n?: string }>;
};

const FLASH: Record<string, { tone: "ok" | "err"; text: string }> = {
  kakao_linked: { tone: "ok", text: "카카오 알림톡을 연동 완료로 표시했습니다." },
  kakao_unlinked: { tone: "ok", text: "카카오 알림톡 연동을 해제했습니다." },
  notice_sent: { tone: "ok", text: "이 매장 점주 알림에 공지를 등록했습니다." },
  orders_paused: { tone: "ok", text: "손님 주문 접수를 일시 정지했습니다." },
  orders_resumed: { tone: "ok", text: "손님 주문 접수를 재개했습니다." },
  plan_saved: { tone: "ok", text: "요금 플랜을 저장했습니다." },
  orders_reset: { tone: "ok", text: "주문 데이터를 초기화했습니다." },
  bad_tenant: { tone: "err", text: "매장 식별자가 올바르지 않습니다." },
  reset_confirm: { tone: "err", text: "슬러그 확인 입력이 일치하지 않습니다." },
  reset_not_allowed: { tone: "err", text: "이 매장은 주문 초기화 대상이 아닙니다." },
  reset_too_many: { tone: "err", text: "주문이 2,000건을 넘어 초기화할 수 없습니다." },
  notice_bad_body: { tone: "err", text: "공지 내용을 2~2,000자로 입력해주세요." },
  no_service: { tone: "err", text: "서버 설정(SUPABASE_SERVICE_ROLE_KEY)이 없습니다." },
  db: { tone: "err", text: "저장에 실패했습니다. DB 마이그레이션을 확인하세요." },
};

function formatWon(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "없음";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "없음";
  return new Date(t).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  pending: "접수",
  accepted: "수락",
  preparing: "준비",
  ready: "완료 대기",
  completed: "완료",
  cancelled: "취소",
};

export default async function OpsStoreDetailPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params;
  const sp = await searchParams;
  const tenantSlug = decodeURIComponent(rawSlug).trim();
  await requirePlatformOperator(`/ops/stores/${encodeURIComponent(tenantSlug)}`);

  const branding = getTenantBranding(tenantSlug);
  const tEnc = encodeURIComponent(tenantSlug);
  const detail = await getPlatformStoreDetail(tenantSlug);
  const storeSettings = await fetchTenantStoreSettings(tenantSlug);
  const flashKey = sp.ok ?? sp.e;
  const flashBase = flashKey ? FLASH[flashKey] : undefined;
  const flash =
    flashBase && flashKey === "orders_reset" && sp.n
      ? { ...flashBase, text: `${flashBase.text} (삭제 ${sp.n}건)` }
      : flashBase;
  const ordersResetAllowed = isOpsOrderResetAllowed(tenantSlug);

  if (!detail.ok) {
    return (
      <OpsConsoleFrame title={branding.displayName} subtitle={tenantSlug}>
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {detail.message}
        </p>
      </OpsConsoleFrame>
    );
  }

  const { store, today, monthAnalytics, recentOrders, auditTrail } = detail;
  const monthSales = monthAnalytics?.totalSales ?? 0;
  const prevMonthSales = monthAnalytics?.prevDaily.reduce((s, d) => s + d.sales, 0) ?? 0;

  return (
    <OpsConsoleFrame
      title={branding.displayName}
      subtitle={`${tenantSlug} · 가입 ${formatWhen(store.firstMemberAt)}`}
      actions={
        <Link
          href="/ops/stores"
          className="text-xs font-semibold text-indigo-400 underline-offset-2 hover:underline"
        >
          ← 매장 목록
        </Link>
      }
    >
      {flash ? (
        <p
          role={flash.tone === "err" ? "alert" : "status"}
          className={[
            "mb-4 rounded-xl border px-3 py-2 text-sm font-medium",
            flash.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
          ].join(" ")}
        >
          {flash.text}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <OpsStoreHealthBadge score={store.health.score} grade={store.health.grade} />
        <Link
          href={`/m/${tEnc}/dashboard`}
          className="rounded-lg border border-ops-border-2 bg-ops-surface px-3 py-1.5 text-xs font-semibold text-ops-subtle"
        >
          점주앱
        </Link>
        <Link
          href={`/t/${tEnc}`}
          className="rounded-lg border border-ops-border-2 bg-ops-surface px-3 py-1.5 text-xs font-semibold text-ops-subtle"
        >
          손님 메뉴
        </Link>
      </div>

      <div className={opsStoreDetailKpiGridClass}>
        <OpsKpiTile label="오늘 매출" value={formatWon(today.totalSales)} highlight />
        <OpsKpiTile label="오늘 주문" value={`${today.orderCount}건`} />
        <OpsKpiTile
          label="이번 달"
          value={monthAnalytics ? formatWon(monthSales) : "—"}
          hint={monthAnalytics ? `전월 ${formatWon(prevMonthSales)}` : undefined}
        />
        <OpsKpiTile label="메뉴" value={`${store.menuCount}개`} hint={`품절 ${store.menusSoldOut}`} />
      </div>

      <div className={`mt-4 space-y-4 ${opsStoreDetailLayoutClass}`}>
        <div className={opsStoreDetailColLeftClass}>
          <OpsSectionCard title="건강 점수 구성">
            <OpsHealthBreakdownList items={store.health.items} />
          </OpsSectionCard>

          <OpsSectionCard title="메뉴 · QR">
            <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              <li>
                메뉴 <strong>{store.menuCount}</strong>개 · 사진 없음{" "}
                <strong>{Math.max(0, store.menuCount - store.menusWithPhoto)}</strong>개 · 품절{" "}
                <strong>{store.menusSoldOut}</strong>개
              </li>
              <li>
                활성 테이블(QR) <strong>{store.activeTableCount}</strong>개
              </li>
              <li>최근 주문 {formatWhen(store.lastOrderAt)}</li>
              <li>점주 앱 활동 {formatWhen(store.lastMerchantActivityAt)}</li>
            </ul>
          </OpsSectionCard>

          {auditTrail.length > 0 ? (
            <OpsSectionCard title="점주 접속 · 활동">
              <ul className="space-y-1.5 text-sm">
                {auditTrail.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2 text-zinc-700 dark:text-zinc-300">
                    <span>{a.actionLabel}</span>
                    <span className="shrink-0 text-xs text-zinc-500">{formatWhen(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </OpsSectionCard>
          ) : null}
        </div>

        <div className={opsStoreDetailColRightClass}>
          <OpsSectionCard title="최근 주문">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-zinc-500">주문 내역이 없습니다.</p>
            ) : (
              <>
                <ul className={`space-y-2 ${opsCompactOnlyClass}`}>
                  {recentOrders.map((o) => (
                    <li
                      key={o.id}
                      className="rounded-xl bg-ops-bg/80 px-3 py-2.5 text-sm dark:bg-zinc-800/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {o.orderNo != null ? `#${o.orderNo}` : "주문"} ·{" "}
                            {STATUS_LABEL[o.status] ?? o.status}
                          </p>
                          <p className="truncate text-xs text-zinc-500">{o.lineSummary}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-bold tabular-nums text-ops-accent">{formatWon(o.totalPrice)}</p>
                          <p className="text-[10px] text-zinc-500">{formatWhen(o.createdAt)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className={opsDesktopOnlyClass}>
                  <OpsDataTable>
                    <OpsDataTableHead>
                      <tr>
                        <th className="px-4 py-3">주문</th>
                        <th className="px-4 py-3">상태</th>
                        <th className="px-4 py-3">내역</th>
                        <th className="px-4 py-3 text-right">금액</th>
                        <th className="px-4 py-3 text-right">시각</th>
                      </tr>
                    </OpsDataTableHead>
                    <OpsDataTableBody>
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="bg-ops-surface dark:bg-zinc-900">
                          <td className="px-4 py-3 font-semibold tabular-nums">
                            {o.orderNo != null ? `#${o.orderNo}` : "—"}
                          </td>
                          <td className="px-4 py-3">{STATUS_LABEL[o.status] ?? o.status}</td>
                          <td className="max-w-xs truncate px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {o.lineSummary}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-ops-accent">
                            {formatWon(o.totalPrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-zinc-500">
                            {formatWhen(o.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </OpsDataTableBody>
                  </OpsDataTable>
                </div>
              </>
            )}
          </OpsSectionCard>

          {monthAnalytics ? (
            <div>
              <MerchantAnalyticsSummary
                days={monthAnalytics.days}
                orderCount={monthAnalytics.orderCount}
                totalSales={monthAnalytics.totalSales}
                completedCount={monthAnalytics.completedCount}
                cancelledCount={monthAnalytics.cancelledCount}
                prevTotalSales={prevMonthSales}
                prevOrderCount={monthAnalytics.prevDaily.reduce((s, d) => s + d.orders, 0)}
              />
              <p className="mt-2 text-center text-xs text-zinc-500">이번 달 · 점주 분석과 동일 집계</p>
            </div>
          ) : null}

          <OpsStoreOpsActionsCard
            tenantSlug={tenantSlug}
            settings={storeSettings}
            ordersResetAllowed={ordersResetAllowed}
          />

          <OpsStoreKakaoAlimtalkCard tenantSlug={tenantSlug} settings={storeSettings} />
        </div>
      </div>
    </OpsConsoleFrame>
  );
}
