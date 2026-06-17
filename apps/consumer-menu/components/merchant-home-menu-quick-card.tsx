import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

import { merchantMenusHref } from "@/lib/merchant/merchant-menus-href";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
};

/** 카테고리 없는 항목에 쓸 레이블 */
const NO_CATEGORY = "기타";

/**
 * 홈 메뉴 빠른 현황 카드.
 * - 카테고리별 그룹 표시 (null → "기타").
 * - 각 카테고리 안에서 품절 → 판매중 순.
 */
export function MerchantHomeMenuQuickCard({ tenant, items }: Props) {
  if (items.length === 0) return null;

  const soldOutCount = items.filter((m) => m.isSoldOut).length;

  // 카테고리 순서 유지 (첫 등장 순) + 각 그룹 내 품절 우선
  const categoryOrder: string[] = [];
  const grouped: Record<string, ChayaMenuRow[]> = {};

  for (const item of items) {
    const cat = item.category ?? NO_CATEGORY;
    if (!grouped[cat]) {
      grouped[cat] = [];
      categoryOrder.push(cat);
    }
    grouped[cat]!.push(item);
  }

  // 각 카테고리 내 정렬: 품절 → 판매중
  for (const cat of categoryOrder) {
    grouped[cat]!.sort((a, b) => {
      if (a.isSoldOut === b.isSoldOut) return 0;
      return a.isSoldOut ? -1 : 1;
    });
  }

  return (
    <section aria-label="메뉴 현황">
      {/* 섹션 레이블 */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          메뉴 현황
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <div className="rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
        {/* 카드 헤더 */}
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

        {/* 카테고리별 그룹 */}
        <div className="pb-2">
          {categoryOrder.map((cat, catIdx) => (
            <div key={cat}>
              {/* 카테고리 헤더 */}
              <div
                className={[
                  "flex items-center gap-2 px-4 py-1.5",
                  catIdx === 0 ? "border-t border-zinc-100 dark:border-zinc-800" : "border-t border-zinc-100 dark:border-zinc-800",
                ].join(" ")}
              >
                <span className="text-[11px] font-bold tracking-wide text-zinc-400 dark:text-zinc-500">
                  {cat}
                </span>
                <span className="text-[10px] font-semibold text-zinc-300 dark:text-zinc-600">
                  {grouped[cat]!.length}개
                </span>
                {grouped[cat]!.some((m) => m.isSoldOut) ? (
                  <span className="text-[10px] font-bold text-red-400 dark:text-red-500">
                    품절 {grouped[cat]!.filter((m) => m.isSoldOut).length}
                  </span>
                ) : null}
              </div>

              {/* 해당 카테고리 메뉴 목록 */}
              <ul className="divide-y divide-zinc-50 px-4 dark:divide-zinc-800/50">
                {grouped[cat]!.map((menu) => (
                  <li
                    key={menu.id}
                    className={`flex items-center justify-between py-2.5 ${
                      menu.isSoldOut ? "opacity-70" : ""
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
                      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        {menu.price.toLocaleString("ko-KR")}원
                      </p>
                    </div>
                    {menu.isSoldOut ? (
                      <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                        품절
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                        판매중
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
