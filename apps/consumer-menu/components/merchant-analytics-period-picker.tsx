"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  tenant: string;
  currentDays: number | null;
  currentFrom: string | null;
  currentTo: string | null;
  currentMonth: boolean;
  currentLastMonth: boolean;
};

// ── 날짜 헬퍼 ─────────────────────────────────────────────────
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}
function todayKst(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}
function shiftRange(from: string, to: string, dir: -1 | 1): { from: string; to: string } {
  const days = Math.round(
    (new Date(`${to}T00:00:00+09:00`).getTime() -
      new Date(`${from}T00:00:00+09:00`).getTime()) /
      86_400_000,
  ) + 1;
  const delta = dir * days;
  const nf = shiftDate(from, delta);
  const nt = shiftDate(to, delta);
  const today = todayKst();
  if (nt > today) return { from: shiftDate(today, -(days - 1)), to: today };
  return { from: nf, to: nt };
}
function periodToRange(days: number): { from: string; to: string } {
  const today = todayKst();
  return { from: shiftDate(today, -(days - 1)), to: today };
}
function thisMonthRange(): { from: string; to: string } {
  const today = todayKst();
  const [y, mo] = today.split("-").map(Number) as [number, number];
  return { from: `${y}-${String(mo).padStart(2, "0")}-01`, to: today };
}
function lastMonthRange(): { from: string; to: string } {
  const today = todayKst();
  const [y, mo] = today.split("-").map(Number) as [number, number];
  const prevMo = mo === 1 ? 12 : mo - 1;
  const prevY = mo === 1 ? y - 1 : y;
  const lastDay = new Date(prevY, prevMo, 0).getDate(); // 말일
  const mm = String(prevMo).padStart(2, "0");
  return { from: `${prevY}-${mm}-01`, to: `${prevY}-${mm}-${lastDay}` };
}

// ── 날짜 표시 포매터 ──────────────────────────────────────────
function fmtRangeLabel(from: string, to: string): string {
  const fmt = (d: string) => d.slice(5).replace("-", "/"); // 2026-05-21 → 05/21
  if (from === to) return fmt(from);
  return `${fmt(from)} ~ ${fmt(to)}`;
}
function fmtRangeSub(days: number, from: string, to: string, currentMonth: boolean, currentLastMonth: boolean): string {
  if (currentLastMonth) {
    const [y, mo] = from.split("-").map(Number) as [number, number];
    return `${y}년 ${mo}월`;
  }
  if (currentMonth) {
    const [y, mo] = from.split("-").map(Number) as [number, number];
    return `${y}년 ${mo}월`;
  }
  if (days === 1) {
    const d = new Date(`${from}T00:00:00+09:00`);
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return `${dayNames[d.getDay()]}요일`;
  }
  return `${days}일간`;
}

// ── 칩 스타일 ─────────────────────────────────────────────────
const chipActive =
  "shrink-0 whitespace-nowrap rounded-full bg-chaya-primary px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm";
const chipIdle =
  "shrink-0 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";

export function MerchantAnalyticsPeriodPicker({
  tenant,
  currentDays,
  currentFrom,
  currentTo,
  currentMonth,
  currentLastMonth,
}: Props) {
  const router = useRouter();
  const tEnc = encodeURIComponent(tenant);
  const isCustom = !!(currentFrom && currentTo) && !currentMonth && !currentLastMonth;
  const [from, setFrom] = useState(currentFrom ?? "");
  const [to, setTo] = useState(currentTo ?? "");
  const [showCustom, setShowCustom] = useState(false);
  const today = todayKst();

  const nav = (url: string) => router.push(url);

  const applyCustom = () => {
    if (!from || !to || from > to) return;
    setShowCustom(false);
    nav(`/m/${tEnc}/analytics?from=${from}&to=${to}`);
  };

  // 현재 활성 기간 범위
  const activeRange =
    isCustom && currentFrom && currentTo
      ? { from: currentFrom, to: currentTo }
      : currentLastMonth
        ? lastMonthRange()
        : currentMonth
          ? thisMonthRange()
          : periodToRange(currentDays ?? 1);

  const activeDays = Math.round(
    (new Date(`${activeRange.to}T00:00:00+09:00`).getTime() -
      new Date(`${activeRange.from}T00:00:00+09:00`).getTime()) /
      86_400_000,
  ) + 1;

  const canGoNext = activeRange.to < today;

  const handleShift = (dir: -1 | 1) => {
    const { from: nf, to: nt } = shiftRange(activeRange.from, activeRange.to, dir);
    nav(`/m/${tEnc}/analytics?from=${nf}&to=${nt}`);
  };

  return (
    <div className="mb-4 space-y-2.5 merchant-analytics-period">
      {/* 기간 칩 — 한 줄 가로 스크롤 */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="분석 기간 선택"
      >
        <button
          type="button"
          className={!isCustom && !currentMonth && !currentLastMonth && (currentDays === 1 || (!currentDays && !currentFrom)) ? chipActive : chipIdle}
          onClick={() => { setShowCustom(false); nav(`/m/${tEnc}/analytics?days=1`); }}
        >
          오늘(영업일)
        </button>
        <button
          type="button"
          className={!isCustom && !currentMonth && !currentLastMonth && currentDays === 7 ? chipActive : chipIdle}
          onClick={() => { setShowCustom(false); nav(`/m/${tEnc}/analytics?days=7`); }}
        >
          최근 7영업일
        </button>
        <button
          type="button"
          className={!isCustom && !currentMonth && !currentLastMonth && currentDays === 30 ? chipActive : chipIdle}
          onClick={() => { setShowCustom(false); nav(`/m/${tEnc}/analytics?days=30`); }}
        >
          최근 30영업일
        </button>
        <button
          type="button"
          className={currentMonth ? chipActive : chipIdle}
          onClick={() => { setShowCustom(false); nav(`/m/${tEnc}/analytics?month=1`); }}
        >
          이번 달
        </button>
        <button
          type="button"
          className={currentLastMonth ? chipActive : chipIdle}
          onClick={() => { setShowCustom(false); nav(`/m/${tEnc}/analytics?lastmonth=1`); }}
        >
          지난 달
        </button>
        <button
          type="button"
          className={(isCustom && !showCustom) || showCustom ? chipActive : chipIdle}
          onClick={() => setShowCustom((v) => !v)}
        >
          기간 지정
        </button>
      </div>

      {/* ◀ 날짜 범위 ▶ */}
      <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => handleShift(-1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-800"
          aria-label="이전 기간"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 flex-col items-center">
          <span className="text-[14px] font-bold text-zinc-900 dark:text-zinc-50">
            {fmtRangeLabel(activeRange.from, activeRange.to)}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {fmtRangeSub(activeDays, activeRange.from, activeRange.to, currentMonth, currentLastMonth)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleShift(1)}
          disabled={!canGoNext}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition active:bg-zinc-100 disabled:opacity-30 dark:text-zinc-400 dark:active:bg-zinc-800"
          aria-label="다음 기간"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 기간 직접 입력 */}
      {showCustom ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-end gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-500">시작일</label>
              <input
                type="date"
                value={from}
                max={to || today}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>
            <span className="mb-2.5 shrink-0 text-sm text-zinc-400">~</span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-500">종료일</label>
              <input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>
            <button
              type="button"
              disabled={!from || !to || from > to}
              onClick={applyCustom}
              className="shrink-0 rounded-xl bg-chaya-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              조회
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
