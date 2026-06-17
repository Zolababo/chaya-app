"use client";

import { formatConsumerOrderNo } from "@/lib/orders/format-order-no";
import type { MerchantOrderRow } from "@/lib/orders/list-orders-for-merchant";

type Props = {
  row: MerchantOrderRow;
  selected: boolean;
  isDelayed: boolean;
  onSelect: (orderId: string) => void;
};

function fmtTime(isoStr: string): string {
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

function statusLabel(status: string, isDelayed: boolean): string {
  if (isDelayed) return "조리 지연";
  const map: Record<string, string> = {
    pending: "신규",
    accepted: "조리중",
    preparing: "조리중",
    ready: "서빙완료",
    completed: "결제완료",
    cancelled: "취소",
  };
  return map[status] ?? status;
}

/** 가로 2-pane 왼쪽 — 선택 가능한 주문 한 줄 */
export function MerchantOrderQueueCompactRow({ row, selected, isDelayed, onSelect }: Props) {
  const label = formatConsumerOrderNo(row.order_no, row.id);
  const firstLine = row.lines[0]?.name ?? "—";
  const extra = row.lines.length > 1 ? ` 외 ${row.lines.length - 1}건` : "";

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(row.id)}
        aria-current={selected ? "true" : undefined}
        className={[
          "flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
          selected
            ? "border-chaya-primary bg-chaya-primary/5 ring-2 ring-chaya-primary/30 dark:bg-orange-950/20"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/80",
          isDelayed ? "border-l-4 border-l-red-500" : "",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="shrink-0 text-xl font-black tabular-nums text-zinc-900 dark:text-zinc-50">
              {row.table_no ?? "—"}
            </span>
            <span className="shrink-0 text-xs text-zinc-400">번</span>
            <span className="truncate text-xs font-semibold text-zinc-400">#{label}</span>
          </div>
          <p className="mt-0.5 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {firstLine}
            {extra}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-400">{fmtTime(row.created_at)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] font-bold",
              isDelayed
                ? "bg-red-500 text-white"
                : row.status === "pending"
                  ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
            ].join(" ")}
          >
            {statusLabel(row.status, isDelayed)}
          </span>
          <span className="text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {row.total_price.toLocaleString("ko-KR")}
            <span className="ml-0.5 text-[10px] font-semibold text-zinc-400">원</span>
          </span>
        </div>
      </button>
    </li>
  );
}
