"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { ChayaMenuRow } from "@/lib/menus/types";
import { formatKrw } from "@/lib/menus/queries";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categories: string[];
};

function MenuCardImage({ imageUrl }: { imageUrl: string | null }) {
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
    <img src={imageUrl} alt="" className="h-40 w-full object-cover" />
  );
}

export function MenuBoard({ tenant, items, categories }: Props) {
  const [active, setActive] = useState<string | null>(categories[0] ?? null);

  const filtered = useMemo(() => {
    if (!active || categories.length <= 1) return items;
    return items.filter((i) => (i.category?.trim() || "기타") === active);
  }, [items, active, categories.length]);

  return (
    <>
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
                className={
                  selected
                    ? "shrink-0 rounded-full bg-chaya-primary px-5 py-3 text-sm font-semibold text-chaya-on-primary shadow-sm"
                    : "shrink-0 rounded-full border border-chaya-border bg-chaya-surface px-5 py-3 text-sm font-semibold text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
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
            <MenuCardImage imageUrl={item.imageUrl} />
            <div className="p-4">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-chaya-muted dark:text-zinc-400">
                {item.description ?? ""}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-lg font-semibold text-chaya-primary dark:text-orange-400">
                  {formatKrw(item.price)}
                </span>
                <Link
                  href={`/t/${tenant}/menu/${encodeURIComponent(item.id)}`}
                  className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
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
