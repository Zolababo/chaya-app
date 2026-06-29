import type { ReactNode } from "react";

export type MerchantSalesMetricCell = {
  key: string;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  valueClassName?: string;
};

type Props = {
  items: MerchantSalesMetricCell[];
  /** analytics 카드는 약간 큰 타이포 */
  variant?: "home" | "analytics";
};

const CELL_HOME = "flex w-[5.5rem] shrink-0 flex-col items-center justify-between px-2 py-2 text-center";
const CELL_ANALYTICS =
  "flex w-[5.75rem] shrink-0 flex-col items-center justify-between px-2 py-3 text-center";

export function MerchantSalesMetricsStrip({ items, variant = "home" }: Props) {
  const cellClass = variant === "analytics" ? CELL_ANALYTICS : CELL_HOME;
  const labelClass = "text-[11px] font-semibold text-zinc-400 dark:text-zinc-500";
  const valueHome = "text-xl font-black tabular-nums leading-none text-zinc-900 dark:text-zinc-50";
  const valueAnalytics = "text-[17px] font-extrabold tabular-nums leading-none";

  return (
    <div
      className="-mx-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="매출 세부 지표"
    >
      <div className="flex min-w-max divide-x divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
        {items.map((item) => (
          <div key={item.key} className={cellClass}>
            <p className={labelClass}>{item.label}</p>
            <p
              className={[
                variant === "analytics" ? valueAnalytics : valueHome,
                item.valueClassName ?? "",
              ].join(" ")}
            >
              {item.value}
            </p>
            {item.sub ?? (
              <p className="text-[10px] text-transparent select-none" aria-hidden>
                ·
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
