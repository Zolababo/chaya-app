"use client";

import Link from "next/link";
import { useState } from "react";

import { chayaSurfaceCardPaddedClass } from "@/components/menu-list-styles";

/** 홈 하단 — 안내·문의 (기본 접힘). */
export function MerchantHomeLegalCard() {
  const [open, setOpen] = useState(false);

  return (
    <section className={`mt-4 ${chayaSurfaceCardPaddedClass}`}>
      <button
        type="button"
        className="flex w-full min-h-[44px] items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">안내 및 문의</span>
        <span className="text-sm font-bold text-zinc-500">{open ? "∧ 접기" : "∨ 펼쳐보기"}</span>
      </button>
      {open ? (
        <ul className="mt-4 space-y-2 border-t border-chaya-border pt-4 text-sm dark:border-zinc-700">
          <li>
            <Link href="/start" className="font-semibold text-chaya-primary underline-offset-2 hover:underline">
              CHAYA 이용 안내
            </Link>
          </li>
          <li className="text-zinc-600 dark:text-zinc-400">
            개인정보·주문 데이터는 매장 운영 목적으로만 사용됩니다. 자세한 처리방침은 도입 시 안내합니다.
          </li>
          <li className="text-zinc-600 dark:text-zinc-400">
            고객센터: 매장 카운터 또는 운영 담당자에게 문의해 주세요.
          </li>
          <li className="pt-2 text-xs text-zinc-500 dark:text-zinc-500">CHAYA · 디지털 메뉴·주문</li>
        </ul>
      ) : null}
    </section>
  );
}
