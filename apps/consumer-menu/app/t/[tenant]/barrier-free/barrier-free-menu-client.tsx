"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CHAYA_CART_CHANGED_EVENT, addLine, cartTotalQty } from "@/lib/cart/local-cart";
import type { ChayaMenuRow } from "@/lib/menus/types";
import { formatKrw } from "@/lib/menus/queries";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categories: string[];
};

export function BarrierFreeMenuClient({ tenant, items, categories }: Props) {
  const slug = tenant.trim();
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [cartCount, setCartCount] = useState(0);
  const [lastMessage, setLastMessage] = useState("준비되었습니다.");

  const refreshCartCount = useCallback(() => {
    setCartCount(cartTotalQty(slug));
  }, [slug]);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  useEffect(() => {
    const onChanged = (ev: Event) => {
      const detail = (ev as CustomEvent<{ tenant?: string }>).detail;
      if (detail?.tenant === slug) refreshCartCount();
    };
    const onStorage = (ev: StorageEvent) => {
      if (!ev.key) return;
      const expected = `chaya_cart_v1:${encodeURIComponent(slug)}`;
      if (ev.key === expected) refreshCartCount();
    };
    window.addEventListener(CHAYA_CART_CHANGED_EVENT, onChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHAYA_CART_CHANGED_EVENT, onChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [slug, refreshCartCount]);

  const filtered = useMemo(() => {
    if (selectedCategory === "전체") {
      return items;
    }
    return items.filter((item) => (item.category?.trim() || "기타") === selectedCategory);
  }, [items, selectedCategory]);

  const basePath = `/t/${encodeURIComponent(slug)}`;

  return (
    <>
      <section aria-label="카테고리 선택" className="rounded-2xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <div className="flex flex-wrap gap-2">
          {["전체", ...categories].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category);
                setLastMessage(`카테고리가 ${category}(으)로 바뀌었습니다.`);
              }}
              aria-pressed={selectedCategory === category}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold ${
                selectedCategory === category
                  ? "border-chaya-primary bg-chaya-primary text-chaya-on-primary"
                  : "border-chaya-border bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="메뉴 목록" className="space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            선택한 카테고리에 메뉴가 없습니다.
          </p>
        ) : (
          filtered.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="text-base font-semibold">{item.name}</h2>
                <p className="text-sm font-semibold tabular-nums text-chaya-primary dark:text-orange-400">
                  {formatKrw(item.price)}
                  {item.isSoldOut ? (
                    <span className="ml-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">품절</span>
                  ) : null}
                </p>
                {item.description?.trim() ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
                ) : null}
                <Link
                  href={`${basePath}/menu/${encodeURIComponent(item.id)}`}
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-chaya-primary underline-offset-4 hover:underline dark:text-orange-400"
                  aria-label={`${item.name} 상세 화면에서 수량 선택`}
                >
                  {item.name} 상세·수량 선택
                </Link>
              </div>
              {item.isSoldOut ? (
                <span
                  className="flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 px-4 text-sm font-semibold text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                  aria-label={`${item.name} 품절`}
                >
                  품절
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    addLine(slug, item, 1, null);
                    setLastMessage(`${item.name} 1개를 같은 장바구니에 담았습니다. 하단 카트에서 확인할 수 있습니다.`);
                    refreshCartCount();
                  }}
                  aria-label={`${item.name} 1개 장바구니에 담기`}
                  className="min-h-[44px] shrink-0 rounded-lg bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary hover:bg-chaya-primary-hover"
                >
                  담기
                </button>
              )}
            </article>
          ))
        )}
      </section>

      <nav
        aria-label="편한 메뉴 다음 동작"
        className="flex flex-col gap-3 rounded-2xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950 sm:flex-row sm:flex-wrap sm:justify-center"
      >
        <Link
          href={basePath}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-4 py-3 text-center text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
          aria-label="그리드형 기본 메뉴판으로"
        >
          기본 메뉴로
        </Link>
        <Link
          href={`${basePath}/cart`}
          className="flex min-h-[48px] items-center justify-center rounded-xl bg-chaya-primary px-4 py-3 text-center text-sm font-semibold text-chaya-on-primary"
          aria-label={cartCount > 0 ? `장바구니로 이동, 현재 ${cartCount}개 담김` : "장바구니로 이동"}
        >
          장바구니 확인{cartCount > 0 ? ` (${cartCount}개)` : ""}
        </Link>
        <Link
          href={`${basePath}/orders`}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-4 py-3 text-center text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
          aria-label="주문 현황 목록으로"
        >
          주문 현황
        </Link>
      </nav>

      <section className="rounded-2xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950" aria-label="장바구니 요약">
        <p className="text-sm">이 브라우저에 저장된 수량 합계: {cartCount}개 (일반 메뉴·편한 메뉴·상세 화면이 공유합니다)</p>
      </section>

      <p aria-live="polite" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
        상태 알림: {lastMessage}
      </p>
    </>
  );
}
