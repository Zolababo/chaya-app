import Link from "next/link";
import { ChevronRight, AlarmClock, ClipboardList } from "lucide-react";

import { merchantOrdersTabHref } from "@/lib/merchant/merchant-orders-tab";
import type { MerchantHomeOpsCounts } from "@/lib/orders/merchant-home-ops";

type Props = {
  tenant: string;
  counts: Extract<MerchantHomeOpsCounts, { ok: true }>;
};

type TileProps = {
  label: string;
  count: number;
  href: string;
  variant?: "urgent" | "cooking" | "serving" | "done" | "default";
  /** 주황 점 깜빡임 — 지연 감지 시 사용 */
  delayDot?: boolean;
};

function Tile({ label, count, href, variant = "default", delayDot = false }: TileProps) {
  const variants = {
    urgent: {
      wrap: "bg-red-50 border border-red-200/70 dark:bg-red-950/30 dark:border-red-800/40",
      count: "text-red-600 dark:text-red-400",
      urgentDot: true,
    },
    cooking: {
      wrap: "bg-orange-50 border border-orange-200/70 dark:bg-orange-950/30 dark:border-orange-800/40",
      count: "text-orange-600 dark:text-orange-400",
      urgentDot: false,
    },
    serving: {
      wrap: "bg-sky-50 border border-sky-200/70 dark:bg-sky-950/30 dark:border-sky-800/40",
      count: "text-sky-700 dark:text-sky-400",
      urgentDot: false,
    },
    done: {
      wrap: "bg-emerald-50 border border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-800/30",
      count: "text-emerald-700 dark:text-emerald-400",
      urgentDot: false,
    },
    default: {
      wrap: "bg-zinc-50 border border-zinc-200/50 dark:bg-zinc-800/50 dark:border-zinc-700/50",
      count: "text-zinc-900 dark:text-zinc-100",
      urgentDot: false,
    },
  };

  const v = variants[variant];
  const showRedDot = v.urgentDot && count > 0;
  const showOrangeDot = !showRedDot && delayDot;

  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center rounded-xl px-2 py-3 transition-opacity active:opacity-70 ${v.wrap}`}
    >
      {showRedDot ? (
        <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-red-500" />
      ) : showOrangeDot ? (
        <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-orange-500" />
      ) : null}
      <span className={`text-3xl font-black tabular-nums leading-none ${v.count}`}>
        {count}
      </span>
      <span className="mt-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </Link>
  );
}

export function MerchantHomeOpsCard({ tenant, counts }: Props) {
  const hasDelayed = counts.delayedCount > 0;

  // 테이블 번호 목록 — 번호 있는 것만, 없으면 "없음" 처리
  const delayedTableLabels = counts.delayedOrders
    .map((o) => (o.tableNo ? `T${o.tableNo}` : "없음"))
    .slice(0, 4);
  const extraDelayed = counts.delayedCount - delayedTableLabels.length;

  return (
    <section aria-label="주문 현황">
      {/* 섹션 레이블 */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          지금 처리할 것
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <div className="rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <ClipboardList className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">주문 현황</p>
          </div>
          <Link
            href={`/m/${encodeURIComponent(tenant)}/orders`}
            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
          >
            주문 관리 →
          </Link>
        </div>

        {/* 4개 타일 그리드 */}
        <div className="grid grid-cols-4 gap-2 px-4 py-3">
          <Tile
            label="신규"
            count={counts.pending}
            href={merchantOrdersTabHref(tenant, "pending")}
            variant={counts.pending > 0 ? "urgent" : "default"}
          />
          <Tile
            label="조리중"
            count={counts.cooking}
            href={merchantOrdersTabHref(tenant, "cooking")}
            variant={counts.cooking > 0 ? "cooking" : "default"}
            delayDot={hasDelayed}
          />
          <Tile
            label="서빙완료"
            count={counts.ready}
            href={merchantOrdersTabHref(tenant, "ready")}
            variant={counts.ready > 0 ? "serving" : "default"}
          />
          <Tile
            label="결제완료"
            count={counts.todayPaid}
            href={merchantOrdersTabHref(tenant, "paid")}
            variant={counts.todayPaid > 0 ? "done" : "default"}
          />
        </div>

        {/* 하단 영역 — 지연 경고 바 or 여백 (항상 동일한 패딩 보장) */}
        <div className="px-4 pb-4">
          {hasDelayed ? (
            <Link
              href={merchantOrdersTabHref(tenant, "cooking")}
              className="flex items-center justify-between rounded-xl border-l-4 border-red-500 bg-red-50 px-3 py-2.5 active:opacity-70 dark:bg-red-950/30"
            >
              {/* 좌측: 알람 아이콘 + 텍스트 + 테이블 태그 (한 줄) */}
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                <AlarmClock className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span className="shrink-0 text-sm font-semibold text-red-700 dark:text-red-300">
                  조리 10분 초과
                </span>
                {delayedTableLabels.map((label, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-black text-white dark:bg-red-700"
                  >
                    {label}
                  </span>
                ))}
                {extraDelayed > 0 ? (
                  <span className="rounded-md bg-red-200 px-2 py-0.5 text-xs font-bold text-red-800 dark:bg-red-800/60 dark:text-red-200">
                    +{extraDelayed}건
                  </span>
                ) : null}
              </div>

              {/* 우측: 처리하기 */}
              <div className="flex shrink-0 items-center gap-1 pl-2 text-xs font-bold text-red-600 dark:text-red-400">
                처리하기
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
