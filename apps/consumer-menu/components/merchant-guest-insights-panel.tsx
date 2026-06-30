"use client";

import { useState } from "react";

import { formatGuestVisitDateKst } from "@/lib/merchant/format-guest-last-visit";
import type { MerchantGuestListRow } from "@/lib/merchant/merchant-guest-insights";
import {
  GUEST_FREQUENCY_WINDOWS,
  guestFrequencyCountForWindow,
  type GuestFrequencyWindowDays,
} from "@/lib/merchant/guest-visit-policy";

type SummaryProps = {
  periodLabel: string;
  completedVisits: number;
  uniqueGuests: number;
  returningGuests: number;
  regularGuests: number;
};

function fmtWon(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export function MerchantGuestInsightsSummary({
  periodLabel,
  completedVisits,
  uniqueGuests,
  returningGuests,
  regularGuests,
}: SummaryProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-chaya-border/60 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="손님 요약"
    >
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">손님 · 재방문</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {periodLabel} · 결제완료 · 같은 폰·브라우저
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-800">
        <div className="bg-white px-4 py-3 dark:bg-zinc-900">
          <p className="text-[11px] font-semibold text-zinc-400">결제완료</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-zinc-900 dark:text-zinc-50">
            {completedVisits}
            <span className="ml-0.5 text-sm font-bold text-zinc-400">건</span>
          </p>
        </div>
        <div className="bg-white px-4 py-3 dark:bg-zinc-900">
          <p className="text-[11px] font-semibold text-zinc-400">첫 방문</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-zinc-700 dark:text-zinc-200">
            {Math.max(0, uniqueGuests - returningGuests)}
            <span className="ml-0.5 text-sm font-bold text-zinc-400">명</span>
          </p>
        </div>
        <div className="bg-white px-4 py-3 dark:bg-zinc-900">
          <p className="text-[11px] font-semibold text-zinc-400">재방문</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-sky-700 dark:text-sky-300">
            {returningGuests}
            <span className="ml-0.5 text-sm font-bold text-zinc-400">명</span>
          </p>
        </div>
        <div className="bg-white px-4 py-3 dark:bg-zinc-900">
          <p className="text-[11px] font-semibold text-zinc-400">활성 단골 (90일 3회+)</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-chaya-primary dark:text-orange-400">
            {regularGuests}
            <span className="ml-0.5 text-sm font-bold text-zinc-400">명</span>
          </p>
        </div>
      </div>
    </section>
  );
}

type ListProps = {
  guests: MerchantGuestListRow[];
  hiddenCount: number;
  periodLabel: string;
};

function GuestRow({
  g,
  periodLabel,
  freqWindow,
}: {
  g: MerchantGuestListRow;
  periodLabel: string;
  freqWindow: GuestFrequencyWindowDays;
}) {
  const freqCount = guestFrequencyCountForWindow(
    {
      visitsLast7: g.visitsLast7,
      visitsLast30: g.visitsLast30,
      visitsLast90: g.visitsLast90,
    },
    freqWindow,
  );

  return (
    <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {g.isRegular ? (
              <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                단골 · {g.lifetimeVisitCount}번째 방문
              </span>
            ) : g.isReturning ? (
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                재방문 · {g.lifetimeVisitCount}번째 방문
              </span>
            ) : (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                첫 방문
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {periodLabel} {g.visitCountInPeriod}회 결제 · 평생 {g.lifetimeVisitCount}번째 · 최근 {freqWindow}일{" "}
            {freqCount}회 · 마지막 {formatGuestVisitDateKst(g.lastCompletedAt)}
          </p>
          {g.itemsSummary ? (
            <p className="mt-1 truncate text-xs text-zinc-600 dark:text-zinc-300">{g.itemsSummary}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {fmtWon(g.periodSpend)}
        </p>
      </div>
    </li>
  );
}

export function MerchantGuestInsightsList({ guests, hiddenCount, periodLabel }: ListProps) {
  const [expanded, setExpanded] = useState(false);
  const [freqWindow, setFreqWindow] = useState<GuestFrequencyWindowDays>(30);

  if (guests.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        이 기간에 결제완료된 손님 이력이 없어요.
      </p>
    );
  }

  const totalLabel =
    hiddenCount > 0
      ? `주요 손님 ${guests.length}명 · 외 ${hiddenCount}명`
      : `주요 손님 ${guests.length}명`;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
        aria-expanded={expanded}
      >
        <span>{totalLabel}</span>
        <span className="text-xs font-bold text-chaya-primary dark:text-orange-400">
          {expanded ? "접기" : "펼치기"}
        </span>
      </button>
      {expanded ? (
        <>
          <div
            className="flex flex-wrap gap-1.5 px-0.5"
            role="group"
            aria-label="방문 빈도 기간"
          >
            {GUEST_FREQUENCY_WINDOWS.map((days) => {
              const active = freqWindow === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setFreqWindow(days)}
                  aria-pressed={active}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    active
                      ? "bg-chaya-primary text-white dark:bg-orange-500"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  최근 {days}일
                </button>
              );
            })}
          </div>
          <ul className="space-y-2" aria-label="손님 목록">
            {guests.map((g, i) => (
              <GuestRow
                key={`${g.lastCompletedAt}-${g.lifetimeVisitCount}-${i}`}
                g={g}
                periodLabel={periodLabel}
                freqWindow={freqWindow}
              />
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <p className="px-1 text-center text-xs text-zinc-400 dark:text-zinc-500">
              활성 단골·기간 결제 많은 순 상위 {guests.length}명만 표시 · 같은 폰·브라우저 기준
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
