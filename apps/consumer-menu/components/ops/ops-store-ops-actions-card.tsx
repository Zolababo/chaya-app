import { CreditCard, Megaphone, PauseCircle, PlayCircle, Trash2 } from "lucide-react";

import {
  resetStoreOrdersFromOps,
  sendStoreAnnouncementFromOps,
  setStoreBillingPlanFromOps,
  setStoreOrdersAcceptingFromOps,
} from "@/app/ops/stores/[slug]/actions";
import { OpsBadge, OpsCard } from "@/components/ops/ops-ui";
import {
  TENANT_BILLING_PLANS,
  TENANT_BILLING_PLAN_LABELS,
} from "@/lib/tenant/tenant-billing-plan";
import type { TenantStoreSettings } from "@/lib/tenant/tenant-store-settings";

type Props = {
  tenantSlug: string;
  settings: TenantStoreSettings;
  ordersResetAllowed: boolean;
};

export function OpsStoreOpsActionsCard({ tenantSlug, settings, ordersResetAllowed }: Props) {
  const accepting = settings.ordersAccepting;
  const planLabel = TENANT_BILLING_PLAN_LABELS[settings.billingPlan];

  return (
    <OpsCard title="운영 액션" subtitle="이 매장에만 적용">
      <div className="space-y-5">
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#5B6BF8]" strokeWidth={2} aria-hidden />
              <h3 className="text-xs font-extrabold text-ops-text">요금 플랜</h3>
            </div>
            <OpsBadge tone="indigo">{planLabel}</OpsBadge>
          </div>
          <form action={setStoreBillingPlanFromOps} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="tenant_slug" value={tenantSlug} />
            <label className="flex min-w-[140px] flex-1 flex-col gap-1">
              <span className="text-[10px] font-bold text-[#4A5568]">플랜</span>
              <select
                name="billing_plan"
                defaultValue={settings.billingPlan}
                className="rounded-lg border border-ops-border bg-ops-surface-2 px-2.5 py-2 text-[13px] font-semibold text-ops-text outline-none focus:border-[#5B6BF8]"
              >
                {TENANT_BILLING_PLANS.map((p) => (
                  <option key={p} value={p}>
                    {TENANT_BILLING_PLAN_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg border border-ops-border-2 bg-ops-surface px-4 py-2 text-xs font-bold text-ops-subtle transition hover:opacity-90"
            >
              저장
            </button>
          </form>
          <p className="mt-2 text-[11px] font-medium text-[#4A5568]">
            기능 제한·과금 연동은 추후. 지금은 운영·정산 구분용입니다.
          </p>
        </section>

        <section className="border-t border-ops-border pt-4">
          <div className="mb-2 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-[#5B6BF8]" strokeWidth={2} aria-hidden />
            <h3 className="text-xs font-extrabold text-ops-text">점주 공지</h3>
          </div>
          <p className="mb-2 text-xs font-medium text-[#4A5568]">
            점주앱 <strong className="text-ops-subtle">/m/…/notifications</strong> 알림 목록에 표시됩니다.
          </p>
          <form action={sendStoreAnnouncementFromOps} className="space-y-2">
            <input type="hidden" name="tenant_slug" value={tenantSlug} />
            <textarea
              name="body"
              required
              minLength={2}
              maxLength={2000}
              rows={3}
              placeholder="예: 시스템 점검 안내, 메뉴 사진 업로드 요청 등"
              className="w-full resize-none rounded-lg border border-ops-border bg-ops-surface-2 px-3 py-2.5 text-[13px] font-medium text-ops-text outline-none transition placeholder:text-[#4A5568] focus:border-[#5B6BF8]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#5B6BF8] px-4 py-2 text-xs font-extrabold text-white transition hover:opacity-90"
            >
              이 매장에 공지 발송
            </button>
          </form>
        </section>

        <section className="border-t border-ops-border pt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {accepting ? (
                <PlayCircle className="h-4 w-4 text-[#22D3A0]" strokeWidth={2} aria-hidden />
              ) : (
                <PauseCircle className="h-4 w-4 text-[#F7983A]" strokeWidth={2} aria-hidden />
              )}
              <h3 className="text-xs font-extrabold text-ops-text">손님 주문 접수</h3>
            </div>
            <OpsBadge tone={accepting ? "green" : "orange"}>
              {accepting ? "접수 중" : "일시 정지"}
            </OpsBadge>
          </div>
          <p className="mb-3 text-xs font-medium text-[#4A5568]">
            {accepting
              ? "손님이 메뉴에서 주문할 수 있습니다. 긴급 시 아래에서 접수를 멈출 수 있습니다."
              : "손님 신규 주문이 차단됩니다. 점주가 더보기에서 다시 켤 수도 있습니다."}
          </p>
          <form action={setStoreOrdersAcceptingFromOps}>
            <input type="hidden" name="tenant_slug" value={tenantSlug} />
            <input type="hidden" name="intent" value={accepting ? "pause" : "resume"} />
            <button
              type="submit"
              className={[
                "rounded-lg px-4 py-2 text-xs font-extrabold transition hover:opacity-90",
                accepting
                  ? "border border-ops-border-2 bg-ops-surface text-ops-subtle"
                  : "bg-[#22D3A0] text-[#0B1A14]",
              ].join(" ")}
            >
              {accepting ? "주문 접수 일시 정지" : "주문 접수 재개"}
            </button>
          </form>
        </section>

        {ordersResetAllowed ? (
          <section className="border-t border-ops-border pt-4">
            <div className="mb-2 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-[#F05252]" strokeWidth={2} aria-hidden />
              <h3 className="text-xs font-extrabold text-ops-text">데모 주문 초기화</h3>
            </div>
            <p className="mb-2 text-xs font-medium text-[#4A5568]">
              이 매장의 <strong>주문 행 전체</strong>를 삭제하고 주문 번호를 0부터 다시 셉니다. 메뉴·멤버는
              유지됩니다.
            </p>
            <form action={resetStoreOrdersFromOps} className="space-y-2">
              <input type="hidden" name="tenant_slug" value={tenantSlug} />
              <label className="block">
                <span className="text-[10px] font-bold text-[#4A5568]">
                  확인: 매장 슬러그 <code className="font-mono text-ops-subtle">{tenantSlug}</code> 입력
                </span>
                <input
                  name="confirm_slug"
                  required
                  autoComplete="off"
                  placeholder={tenantSlug}
                  className="mt-1 w-full rounded-lg border border-ops-border bg-ops-surface-2 px-3 py-2 font-mono text-[13px] text-ops-text outline-none focus:border-[#F05252]"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg border border-[rgba(240,82,82,0.35)] bg-[rgba(240,82,82,0.12)] px-4 py-2 text-xs font-extrabold text-[#F05252] transition hover:opacity-90"
              >
                주문 전체 삭제
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </OpsCard>
  );
}
