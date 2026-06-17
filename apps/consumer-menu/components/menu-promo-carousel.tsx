"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type TouchEvent } from "react";

import { isPromoHorizontalSwipe } from "@/lib/consumer/menu-promo-carousel-dom";
import { chayaAppShellBleedClass } from "@/lib/responsive/chaya-app-shell";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";
import { resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";
import type { ChayaMenuRow } from "@/lib/menus/types";

const AUTO_MS = 4500;

export type MenuPromoSlide = {
  item: ChayaMenuRow;
  /** 카드 상단 작은 라벨 (오늘의 메뉴 · 최근 인기 · 사장님 추천) */
  badge: string;
};

type Props = {
  tenant: string;
  slides: MenuPromoSlide[];
  /** 스크린리더용 섹션 이름 */
  ariaLabel: string;
};

/**
 * 손님 메뉴 상단 프로모 — a0 translateX 트랙, 1/N, 도트, 자동·스와이프.
 */
export function MenuPromoCarousel({ tenant, slides, ariaLabel }: Props) {
  const { locale } = useConsumerLocale();
  const navHref = useConsumerNavHref(tenant);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });
  const suppressLinkClick = useRef(false);

  const count = slides.length;
  const safeIndex = count > 0 ? index % count : 0;

  useEffect(() => {
    setIndex(0);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [count, paused]);

  const goNext = () => setIndex((i) => (i + 1) % count);
  const goPrev = () => setIndex((i) => (i - 1 + count) % count);

  const onTouchStart = (e: TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    suppressLinkClick.current = false;
  };

  const onTouchEnd = (e: TouchEvent) => {
    e.stopPropagation();
    if (count <= 1 || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (!isPromoHorizontalSwipe(dx, dy)) return;

    suppressLinkClick.current = true;
    if (dx < 0) goNext();
    else goPrev();
  };

  if (count === 0) return null;

  return (
    <section
      data-menu-promo-carousel
      className={`relative ${chayaAppShellBleedClass} mb-3 touch-pan-y`}
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative overflow-hidden rounded-2xl bg-chaya-surface shadow-sm ring-1 ring-black/[0.03] dark:bg-zinc-900 dark:ring-white/5">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {slides.map((slide, i) => {
            const item = resolveMenuRowForLocale(slide.item, locale);
            const href = navHref(`/t/${tenant}/menu/${encodeURIComponent(item.id)}`);
            const badge = slide.badge;

            return (
              <div key={`${item.id}-${i}`} className="w-full flex-shrink-0">
                <Link
                  href={href}
                  className="flex gap-3 p-3 active:scale-[0.995]"
                  onClick={(e) => {
                    if (suppressLinkClick.current) {
                      e.preventDefault();
                      suppressLinkClick.current = false;
                    }
                  }}
                >
                  {item.imageUrl?.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-chaya-primary/10 text-xl font-semibold text-chaya-primary dark:bg-orange-950/50 dark:text-orange-300"
                      aria-hidden
                    >
                      {item.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <span className="mb-1 inline-block w-fit rounded-md bg-chaya-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-chaya-primary dark:bg-orange-950/50 dark:text-orange-300">
                      {badge}
                    </span>
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.name}</p>
                    <p className="mt-0.5 text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                      {formatConsumerMoney(item.price, locale)}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {count > 1 ? (
          <>
            <span className="pointer-events-none absolute bottom-2 right-3 rounded-md bg-zinc-900/60 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
              {safeIndex + 1}/{count}
            </span>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
              {slides.map((s, i) => (
                <button
                  key={`${s.item.id}-dot-${i}`}
                  type="button"
                  className={[
                    "h-1.5 rounded-full transition-all",
                    i === safeIndex ? "w-4 bg-chaya-primary" : "w-1.5 bg-zinc-900/20 dark:bg-white/25",
                  ].join(" ")}
                  onClick={() => setIndex(i)}
                  aria-label={`${i + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
