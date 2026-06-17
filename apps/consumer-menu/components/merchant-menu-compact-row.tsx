"use client";

import { MenuListThumb } from "@/components/menu-list-thumb";
import { formatKrw } from "@/lib/menus/queries";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  item: ChayaMenuRow;
  selected: boolean;
  onSelect: (menuId: string) => void;
};

/** 가로 2-pane — 선택 가능한 메뉴 한 줄 */
export function MerchantMenuCompactRow({ item, selected, onSelect }: Props) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        aria-current={selected ? "true" : undefined}
        className={[
          "flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
          selected
            ? "border-chaya-primary bg-chaya-primary/5 ring-2 ring-chaya-primary/30 dark:bg-orange-950/20"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600",
          item.isSoldOut ? "opacity-80" : "",
        ].join(" ")}
      >
        <div className="shrink-0 scale-90">
          <MenuListThumb imageUrl={item.imageUrl} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={[
              "truncate text-sm font-bold",
              item.isSoldOut
                ? "text-zinc-400 line-through dark:text-zinc-500"
                : "text-zinc-900 dark:text-zinc-50",
            ].join(" ")}
          >
            {item.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {item.category?.trim() || "기타"} · {formatKrw(item.price)}
          </p>
        </div>
        {item.isSoldOut ? (
          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300">
            품절
          </span>
        ) : null}
      </button>
    </li>
  );
}
