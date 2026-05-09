"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { addLine } from "@/lib/cart/local-cart";
import type { ChayaMenuRow } from "@/lib/menus/types";
import { formatKrw } from "@/lib/menus/queries";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categories: string[];
};

const THUMB_SZ = "h-14 w-14 sm:h-16 sm:w-16";
const ALL_CATEGORY = "전체";

/** 목록 행용 작은 썸네일 — 이름·가격은 옆 링크에서 읽히므로 alt 비움 */
function MenuRowThumb({ imageUrl }: { imageUrl: string | null }) {
  if (!imageUrl?.trim()) {
    return (
      <div
        className={`${THUMB_SZ} shrink-0 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900`}
        aria-hidden
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt="" className={`${THUMB_SZ} shrink-0 rounded-lg object-cover`} />
  );
}

export function MenuBoard({ tenant, items, categories }: Props) {
  const tabCategories = useMemo(() => [ALL_CATEGORY, ...categories], [categories]);
  const [active, setActive] = useState<string>(ALL_CATEGORY);
  const [addedToast, setAddedToast] = useState(false);
  const toastHide = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastHide.current) clearTimeout(toastHide.current);
    };
  }, []);

  const flashAdded = () => {
    setAddedToast(true);
    if (toastHide.current) clearTimeout(toastHide.current);
    toastHide.current = setTimeout(() => setAddedToast(false), 2200);
  };

  const filtered = useMemo(() => {
    if (active === ALL_CATEGORY || categories.length <= 1) return items;
    return items.filter((i) => (i.category?.trim() || "기타") === active);
  }, [items, active, categories.length]);

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 transition-all duration-200 ${
          addedToast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="rounded-2xl border border-chaya-border bg-chaya-surface px-5 py-3 text-sm font-semibold text-zinc-800 shadow-lg dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100">
          장바구니에 담았어요
        </div>
      </div>

      {tabCategories.length > 1 ? (
        <nav
          className="flex gap-1.5 overflow-x-auto pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="카테고리"
        >
          {tabCategories.map((cat) => {
            const selected = active === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                aria-pressed={selected}
                className={
                  selected
                    ? "min-h-[44px] shrink-0 rounded-full bg-chaya-primary px-4 py-2 text-xs font-semibold text-chaya-on-primary shadow-sm sm:px-5 sm:text-sm"
                    : "min-h-[44px] shrink-0 rounded-full border border-chaya-border bg-chaya-surface px-4 py-2 text-xs font-semibold text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 sm:px-5 sm:text-sm"
                }
              >
                {cat}
              </button>
            );
          })}
        </nav>
      ) : null}

      {/* 배달앱형: 한 열 콤팩트 목록 — 행 탭 = 상세, 담기는 별도 (터치 44px 유지) */}
      {filtered.length > 0 ? (
        <ul
          aria-label={`${active !== ALL_CATEGORY ? `${active} 카테고리 ` : ""}메뉴 목록`}
          className="divide-y divide-chaya-border overflow-hidden rounded-xl border border-chaya-border bg-chaya-surface dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-950"
        >
          {filtered.map((item) => (
            <li key={item.id} className="flex items-stretch gap-2 px-2 py-1.5 sm:gap-3 sm:px-3">
              <Link
                href={`/t/${tenant}/menu/${encodeURIComponent(item.id)}`}
                className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 pr-1 outline-none ring-chaya-primary ring-offset-2 ring-offset-background focus-visible:ring-2 sm:gap-3 dark:ring-offset-zinc-950"
                aria-label={`${item.name}, ${formatKrw(item.price)}, 상세 페이지로 이동`}
              >
                <MenuRowThumb imageUrl={item.imageUrl} />
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="truncate text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </h3>
                  {(item.description ?? "").trim() ? (
                    <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-chaya-muted dark:text-zinc-400">
                      {item.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-semibold tabular-nums text-chaya-primary dark:text-orange-400">
                    {formatKrw(item.price)}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                title="1개 장바구니에 담기"
                aria-label={`${item.name} 1개 장바구니에 담기`}
                className="touch-manipulation min-h-[44px] min-w-[44px] self-center rounded-xl border border-chaya-border bg-chaya-surface px-3 py-2 text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                onClick={() => {
                  addLine(tenant, item, 1, null);
                  flashAdded();
                }}
              >
                담기
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-6 text-center text-sm text-chaya-muted dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          이 카테고리에 표시할 메뉴가 없습니다.
        </p>
      )}
    </>
  );
}
