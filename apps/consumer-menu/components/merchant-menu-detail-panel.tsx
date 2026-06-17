"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { MerchantMenuSoldOutToggle } from "@/components/merchant-menu-sold-out-toggle";
import { MenuListThumb } from "@/components/menu-list-thumb";
import { chayaPrimaryButtonClass } from "@/components/menu-list-styles";
import { formatKrw } from "@/lib/menus/queries";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  item: ChayaMenuRow;
};

/** 가로 2-pane — 선택 메뉴 미리보기 + 상세 수정 진입 */
export function MerchantMenuDetailPanel({ tenant, item }: Props) {
  const tEnc = encodeURIComponent(tenant);
  const editHref = `/m/${tEnc}/menus/${encodeURIComponent(item.id)}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3 border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
        <div className="shrink-0">
          <MenuListThumb imageUrl={item.imageUrl} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{item.name}</h2>
          <p className="mt-0.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {item.category?.trim() || "기타"} · {formatKrw(item.price)}
          </p>
          {item.description ? (
            <p className="mt-2 line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">{item.description}</p>
          ) : null}
        </div>
        <MerchantMenuSoldOutToggle tenant={tenant} menuId={item.id} isSoldOut={item.isSoldOut} />
      </div>

      <div className="space-y-3 px-4 py-4">
        {item.isSoldOut ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">
            손님 메뉴판에 품절로 표시돼요.
          </p>
        ) : null}
        <Link href={editHref} className={`${chayaPrimaryButtonClass} w-full gap-1`}>
          상세 수정
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
