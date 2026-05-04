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

function MenuCardImage({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  if (!imageUrl?.trim()) {
    return (
      <div
        className="h-40 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900"
        aria-hidden
      />
    );
  }
  return (
    // 외부 스토리지 URL은 프로젝트마다 다르므로 네이티브 img 사용
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={`${name} 사진`} className="h-40 w-full object-cover" />
  );
}

export function MenuBoard({ tenant, items, categories }: Props) {
  const [active, setActive] = useState<string | null>(categories[0] ?? null);
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
    if (!active || categories.length <= 1) return items;
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

      {categories.length > 1 ? (
        <nav
          className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="카테고리"
        >
          {categories.map((cat) => {
            const selected = active === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                aria-pressed={selected}
                className={
                  selected
                    ? "min-h-[44px] shrink-0 rounded-full bg-chaya-primary px-5 py-3 text-sm font-semibold text-chaya-on-primary shadow-sm"
                    : "min-h-[44px] shrink-0 rounded-full border border-chaya-border bg-chaya-surface px-5 py-3 text-sm font-semibold text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                }
              >
                {cat}
              </button>
            );
          })}
        </nav>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-3xl border border-chaya-border bg-chaya-surface shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <MenuCardImage imageUrl={item.imageUrl} name={item.name} />
            <div className="p-4">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-chaya-muted dark:text-zinc-400">
                {item.description ?? ""}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <span className="mr-auto text-lg font-semibold text-chaya-primary dark:text-orange-400">
                  {formatKrw(item.price)}
                </span>
                <button
                  type="button"
                  title="1개 장바구니에 담기"
                  aria-label={`${item.name} 1개 장바구니에 담기`}
                  className="min-h-[44px] min-w-[44px] rounded-2xl border border-chaya-border bg-chaya-surface px-4 py-3 text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  onClick={() => {
                    addLine(tenant, item, 1, null);
                    flashAdded();
                  }}
                >
                  담기
                </button>
                <Link
                  href={`/t/${tenant}/menu/${encodeURIComponent(item.id)}`}
                  className="min-h-[44px] min-w-[44px] rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                  aria-label={`${item.name} 상세 페이지`}
                >
                  상세
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
