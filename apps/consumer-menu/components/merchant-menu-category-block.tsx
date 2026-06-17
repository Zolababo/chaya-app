"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { MerchantMenuSoldOutToggle } from "@/components/merchant-menu-sold-out-toggle";
import { MenuListThumb } from "@/components/menu-list-thumb";
import { formatKrw } from "@/lib/menus/queries";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  category: string;
  items: ChayaMenuRow[];
  defaultOpen?: boolean;
};

export function MerchantMenuCategoryBlock({
  tenant,
  category,
  items,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const tEnc = encodeURIComponent(tenant);
  const soldOutCount = items.filter((i) => i.isSoldOut).length;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
      {/* 카테고리 헤더 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800/60"
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50">
            {category}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {items.length}개
          </span>
          {soldOutCount > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
              품절 {soldOutCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {/* 메뉴 목록 */}
      {open && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={i > 0 ? "border-t border-zinc-100 dark:border-zinc-800" : ""}
            >
              <div
                className={[
                  "flex items-center gap-3 px-4 py-3.5",
                  item.isSoldOut ? "opacity-50" : "",
                ].join(" ")}
              >
                {/* 이미지 + 텍스트 → 수정 페이지로 이동 */}
                <Link
                  href={`/m/${tEnc}/menus/${encodeURIComponent(item.id)}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  {/* 썸네일 — 64×64 (MenuListThumb 기본 사이즈) */}
                  <div className="shrink-0">
                    <MenuListThumb imageUrl={item.imageUrl} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        "truncate text-[14px] font-bold leading-tight",
                        item.isSoldOut
                          ? "text-zinc-400 line-through dark:text-zinc-600"
                          : "text-zinc-900 dark:text-zinc-50",
                      ].join(" ")}
                    >
                      {item.name}
                    </p>
                    <p
                      className={[
                        "mt-0.5 text-[13px] font-semibold",
                        item.isSoldOut
                          ? "text-zinc-400 line-through dark:text-zinc-600"
                          : "text-zinc-600 dark:text-zinc-400",
                      ].join(" ")}
                    >
                      {formatKrw(item.price)}
                    </p>
                    {item.description ? (
                      <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </Link>

                {/* 품절 토글 */}
                <MerchantMenuSoldOutToggle
                  tenant={tenant}
                  menuId={item.id}
                  isSoldOut={item.isSoldOut}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
