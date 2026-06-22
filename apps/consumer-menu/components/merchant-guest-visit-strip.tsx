import type { MerchantGuestOrderContext } from "@/lib/merchant/guest-order-context";
import { formatGuestLastVisitLine } from "@/lib/merchant/format-guest-last-visit";
import { guestVisitTierLabel } from "@/lib/merchant/guest-visit-policy";

type Props = {
  guest: MerchantGuestOrderContext;
  compact?: boolean;
};

const TIER_CLASS: Record<MerchantGuestOrderContext["tier"], string> = {
  first: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  returning: "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  regular: "bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
};

/** 주문 카드 — 익명 손님 방문·단골 표시 (접수 시점부터) */
export function MerchantGuestVisitStrip({ guest, compact = false }: Props) {
  const tierLabel = guestVisitTierLabel(guest.tier);
  const visitLabel = `${guest.visitNumber}번째 방문`;

  const lastLine =
    guest.lastVisitAt && guest.lastVisitTotal != null
      ? formatGuestLastVisitLine({
          completedAt: guest.lastVisitAt,
          totalPrice: guest.lastVisitTotal,
          itemsSummary: guest.lastVisitItemsSummary ?? "",
        })
      : null;

  if (compact) {
    return (
      <span
        className={`inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-bold ${TIER_CLASS[guest.tier]}`}
      >
        <span className="truncate">
          {tierLabel === "단골" ? "단골" : tierLabel} · {visitLabel}
        </span>
      </span>
    );
  }

  return (
    <div
      className="mx-4 mb-2 rounded-xl border border-chaya-border/50 bg-zinc-50/90 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/50"
      aria-label={`${tierLabel}, ${visitLabel}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TIER_CLASS[guest.tier]}`}
        >
          {tierLabel} · {visitLabel}
        </span>
      </div>
      {lastLine ? (
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{lastLine}</p>
      ) : guest.tier === "first" ? (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">이 매장 첫 결제완료 손님이에요.</p>
      ) : null}
    </div>
  );
}
