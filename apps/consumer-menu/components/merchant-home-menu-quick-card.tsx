import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

import { merchantMenusHref } from "@/lib/merchant/merchant-menus-href";
import { groupMenuItemsByCategory, sortCategoryNames } from "@/lib/menus/category-order";
import {
  menuCategoryHeaderClassForIndex,
  menuCategorySectionClassForIndex,
} from "@/lib/menus/menu-category-tints";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
};

function sortSoldOutFirst(rows: ChayaMenuRow[]): ChayaMenuRow[] {
  return [...rows].sort((a, b) => {
    if (a.isSoldOut === b.isSoldOut) return 0;
    return a.isSoldOut ? -1 : 1;
  });
}

/**
 * 홈 메뉴 빠른 현황 카드.
 * - 소비자 메뉴판과 동일 카테고리 색상 팔레트.
 * - 각 카테고리 안에서 품절 → 판매중 순.
 */
export function MerchantHomeMenuQuickCard({ tenant, items }: Props) {
  if (items.length === 0) return null;

  const soldOutCount = items.filter((m) => m.isSoldOut).length;
  const categories = sortCategoryNames([
    ...new Set(items.map((m) => m.category?.trim() || "기타")),
  ]);
  const sections = groupMenuItemsByCategory(items, categories).map((section) => ({
    ...section,
    items: sortSoldOutFirst(section.items),
  }));

  return (
    <section aria-label="메뉴 현황">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          메뉴 현황
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <div className="rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
              <UtensilsCrossed className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">판매 메뉴</p>
            {soldOutCount > 0 ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                품절 {soldOutCount}
              </span>
            ) : null}
          </div>
          <Link
            href={merchantMenusHref(tenant)}
            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
          >
            메뉴 관리 →
          </Link>
        </div>

        <div className="space-y-2 border-t border-zinc-100 px-3 pt-3 pb-3 dark:border-zinc-800">
          {sections.map((section, catIdx) => {
            const catSoldOut = section.items.filter((m) => m.isSoldOut).length;
            return (
              <div
                key={section.category}
                className={menuCategorySectionClassForIndex(catIdx)}
                aria-labelledby={`merchant-home-cat-${catIdx}`}
              >
                <div
                  id={`merchant-home-cat-${catIdx}`}
                  className="flex flex-wrap items-center gap-2 px-3 py-2"
                >
                  <span className={menuCategoryHeaderClassForIndex(catIdx)}>{section.category}</span>
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                    {section.items.length}개
                  </span>
                  {catSoldOut > 0 ? (
                    <span className="text-[10px] font-bold text-red-500 dark:text-red-400">
                      품절 {catSoldOut}
                    </span>
                  ) : null}
                </div>

                <ul className="divide-y divide-black/5 border-t border-black/5 dark:divide-white/5 dark:border-white/5">
                  {section.items.map((menu) => (
                    <li
                      key={menu.id}
                      className={`flex items-center justify-between px-3 py-2.5 ${
                        menu.isSoldOut ? "opacity-75" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p
                          className={`truncate text-sm font-semibold ${
                            menu.isSoldOut
                              ? "text-zinc-400 line-through dark:text-zinc-500"
                              : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {menu.name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {menu.price.toLocaleString("ko-KR")}원
                        </p>
                      </div>
                      {menu.isSoldOut ? (
                        <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                          품절
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-zinc-900/60 dark:text-emerald-300 dark:ring-emerald-800/50">
                          판매중
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
