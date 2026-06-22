"use client";

import { MerchantOrderCancelPanel } from "@/components/merchant-order-cancel-panel";
import { MerchantGuestVisitStrip } from "@/components/merchant-guest-visit-strip";
import { updateOrderStatusFromForm } from "@/app/m/[tenant]/orders/actions";
import { formatConsumerOrderNo } from "@/lib/orders/format-order-no";
import { merchantCancelReasonLabel } from "@/lib/orders/merchant-cancel-reasons";
import { merchantOrderQuickActions } from "@/lib/orders/merchant-order-quick-actions";
import { isMerchantOrdersTerminalTab } from "@/lib/orders/merchant-order-stage";
import type { MerchantOrderRow } from "@/lib/orders/list-orders-for-merchant";
import type { MerchantOrdersTab } from "@/lib/merchant/merchant-orders-tab";

type Props = {
  tenant: string;
  row: MerchantOrderRow;
  ordersTab: MerchantOrdersTab;
  canMutateOrders: boolean;
  /** 지연 주문 ID 세트 — 조리 10분 초과 강조 표시용 */
  delayedIds?: Set<string>;
};

function minutesSince(createdAt: string): number {
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return 0;
  const diff = Date.now() - t;
  if (diff <= 0) return 0;
  return Math.floor(diff / 60000);
}

function fmtTime(isoStr: string): string {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

// ── 경과 시간 배지 ──────────────────────────────────────────────────────────
type ElapsedVariant = "ok" | "mid" | "late";

function elapsedInfo(minutes: number, status: string): { label: string; variant: ElapsedVariant } {
  if (status === "ready" || status === "completed") return { label: "서빙 완료", variant: "ok" };
  if (minutes === 0) return { label: "방금", variant: "ok" };
  if (minutes < 5) return { label: `${minutes}분 전`, variant: "ok" };
  if (minutes < 10) return { label: `${minutes}분 경과`, variant: "mid" };
  return { label: `${minutes}분 경과`, variant: "late" };
}

const ELAPSED_CLASS: Record<ElapsedVariant, string> = {
  ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  mid: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
  late: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
};

// ── 상태 필 ────────────────────────────────────────────────────────────────
function StatusPill({ status, isDelayed }: { status: string; isDelayed: boolean }) {
  if (isDelayed) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white">
        <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-white" />
        조리 지연
      </span>
    );
  }
  const cfg: Record<string, { cls: string; dot: boolean; label: string }> = {
    pending: { cls: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400", dot: true, label: "신규" },
    accepted: { cls: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400", dot: false, label: "조리중" },
    preparing: { cls: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400", dot: false, label: "조리중" },
    ready: { cls: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400", dot: false, label: "서빙완료" },
    completed: { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400", dot: false, label: "결제완료" },
    cancelled: { cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400", dot: false, label: "취소" },
  };
  const c = cfg[status] ?? cfg.cancelled;
  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${c.cls}`}>
      {c.dot ? <span className="h-[5px] w-[5px] animate-ping rounded-full bg-current" /> : null}
      {c.label}
    </span>
  );
}

// ── 액션 버튼 스타일 ───────────────────────────────────────────────────────
const ACTION_BTN_CLASS: Record<string, string> = {
  preparing: "bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white",
  ready: "bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white",
  completed: "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white",
};

function actionBtnLabel(nextStatus: string, tableNo: string | null): string {
  const t = tableNo ? `${tableNo}번 테이블 ` : "";
  switch (nextStatus) {
    case "preparing": return `✓ ${t}조리 시작`;
    case "ready":     return `✓ ${t}서빙 완료`;
    case "completed": return `✓ ${t}결제 완료`;
    default: return nextStatus;
  }
}

// ── 지연 도미넌트 카드 헤더 ────────────────────────────────────────────────
function DelayDominantHeader({ tableNo, minutes }: { tableNo: string | null; minutes: number }) {
  const t = tableNo ? `${tableNo}번 테이블` : "미지정";
  return (
    <div className="flex min-w-0 items-center gap-2 bg-red-500 px-4 py-2.5">
      {/* 이모지: 줄어들지 않도록 */}
      <span className="shrink-0 animate-[wiggle_0.8s_ease_infinite] text-[15px]">🚨</span>
      {/* 텍스트: 남은 공간 차지, 넘치면 말줄임 */}
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">
        {t} — 조리 지연 중이에요!
      </span>
      {/* 뱃지: 절대 줄바꿈 없이 오른쪽 끝 고정 */}
      <span className="shrink-0 rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-white">
        {minutes}분 경과
      </span>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export function MerchantOrderQueueCard({
  tenant,
  row,
  ordersTab,
  canMutateOrders,
  delayedIds,
}: Props) {
  const label = formatConsumerOrderNo(row.order_no, row.id);
  const quick = merchantOrderQuickActions(row.status);
  const minutes = minutesSince(row.created_at);
  const terminal = isMerchantOrdersTerminalTab(ordersTab);
  const cancelLabel = merchantCancelReasonLabel(row.cancel_reason);
  const primary = quick.filter((a) => a.tone === "primary");
  const hasCancel = quick.some((a) => a.status === "cancelled");
  const showActions = canMutateOrders && !terminal && (primary.length > 0 || hasCancel);
  const isDelayed = !!(delayedIds?.has(row.id));
  const elapsed = elapsedInfo(minutes, row.status);

  // 카드 테두리 색상
  const borderClass =
    isDelayed ? "border-l-red-500 border-red-200 dark:border-red-800"
    : row.status === "pending" ? "border-l-red-400 border-zinc-100 dark:border-zinc-800"
    : row.status === "accepted" || row.status === "preparing" ? "border-l-orange-400 border-zinc-100 dark:border-zinc-800"
    : row.status === "ready" ? "border-l-sky-400 border-zinc-100 dark:border-zinc-800"
    : row.status === "completed" ? "border-l-emerald-400 border-zinc-100 dark:border-zinc-800"
    : "border-l-zinc-300 border-zinc-100 dark:border-zinc-800";

  return (
    <li
      className={[
        "overflow-hidden rounded-2xl border border-l-4 bg-white shadow-sm dark:bg-zinc-900",
        borderClass,
        isDelayed ? "shadow-red-100 dark:shadow-red-950/20" : "",
      ].join(" ")}
    >
      {/* 지연 도미넌트 헤더 */}
      {isDelayed ? (
        <DelayDominantHeader tableNo={row.table_no} minutes={minutes} />
      ) : null}

      {/* 카드 상단 — 테이블 번호 + 상태 필 */}
      <div className="flex min-w-0 items-center gap-2 px-4 pt-3.5 pb-2">
        {/* 왼쪽: 테이블 번호 + 주문번호 태그 — 남은 공간 차지 */}
        <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span className={[
            "shrink-0 font-black leading-none tabular-nums",
            terminal ? "text-xl text-zinc-400 dark:text-zinc-500" : "text-2xl text-zinc-900 dark:text-zinc-50",
          ].join(" ")}>
            {row.table_no ?? "—"}
          </span>
          <span className="shrink-0 text-sm text-zinc-400 dark:text-zinc-500">번 테이블</span>
          <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            #{label}
          </span>
        </div>
        {/* 오른쪽: 상태 필 — 절대 줄바꿈 없이 고정 */}
        <div className="shrink-0">
          <StatusPill status={row.status} isDelayed={isDelayed} />
        </div>
      </div>

      {/* 구분선 */}
      <div className="mx-4 border-t border-zinc-100 dark:border-zinc-800" />

      {row.guestContext ? <MerchantGuestVisitStrip guest={row.guestContext} /> : null}

      {/* 메뉴 목록 */}
      <div className="space-y-1.5 px-4 py-3">
        {row.lines.map((line, i) => (
          <div key={i} className="flex items-start gap-2">
            {/* 수량 칩 — 항상 첫 줄 상단 고정 */}
            <span className="mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[11px] font-extrabold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {line.quantity}
            </span>
            {/* 메뉴 이름 — 줄바꿈 허용, 왼쪽 정렬 유지 */}
            <span className={[
              "flex-1 text-[14px] font-semibold leading-snug",
              terminal ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100",
            ].join(" ")}>
              {line.name}
            </span>
          </div>
        ))}

        {/* 요청사항 */}
        {row.guest_note ? (
          <div className="mt-1 flex items-start gap-1.5 rounded-r-lg border-l-[3px] border-amber-400 bg-amber-50 py-1.5 pl-2.5 pr-2 dark:border-amber-600 dark:bg-amber-950/30">
            <span className="shrink-0 text-xs">📝</span>
            <p className="text-xs font-semibold leading-snug text-amber-900 dark:text-amber-200">
              {row.guest_note}
            </p>
          </div>
        ) : null}

        {/* 취소 사유 */}
        {ordersTab === "cancelled" && cancelLabel ? (
          <p className="mt-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            취소 사유: {cancelLabel}
          </p>
        ) : null}
      </div>

      {/* 카드 하단 — 경과시간 + 접수시각 + 금액 */}
      <div className="flex min-w-0 items-center gap-2 px-4 pb-3">
        {/* 왼쪽: 경과 뱃지 + 접수시각 */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className={[
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
            ELAPSED_CLASS[elapsed.variant],
          ].join(" ")}>
            {elapsed.label}
          </span>
          <span className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
            {fmtTime(row.created_at)} 도착
          </span>
        </div>
        {/* 오른쪽: 금액 — 항상 한 줄 고정 */}
        <span className={[
          "shrink-0 text-[16px] font-black tabular-nums",
          terminal ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-50",
        ].join(" ")}>
          {row.total_price.toLocaleString("ko-KR")}
          <span className="ml-0.5 text-xs font-semibold text-zinc-400">원</span>
        </span>
      </div>

      {/* 액션 버튼 */}
      {showActions ? (
        <div className="space-y-1.5 px-4 pb-4">
          {primary.map((action) => (
            <form key={action.status} action={updateOrderStatusFromForm} className="w-full">
              <input type="hidden" name="tenant_slug" value={tenant} />
              <input type="hidden" name="order_id" value={row.id} />
              <input type="hidden" name="current_status" value={row.status} />
              <input type="hidden" name="status" value={action.status} />
              <input type="hidden" name="orders_tab" value={ordersTab} />
              <button
                type="submit"
                className={[
                  "w-full rounded-xl py-3.5 text-[15px] font-extrabold transition",
                  ACTION_BTN_CLASS[action.status] ?? "bg-zinc-200 text-zinc-700",
                ].join(" ")}
              >
                {actionBtnLabel(action.status, row.table_no)}
              </button>
            </form>
          ))}
          {hasCancel && (row.status === "pending" || row.status === "accepted" || row.status === "preparing") ? (
            <MerchantOrderCancelPanel
              tenant={tenant}
              orderId={row.id}
              currentStatus={row.status}
              ordersTab={ordersTab}
            />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
