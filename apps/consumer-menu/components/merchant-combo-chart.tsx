"use client";

import React, { useId, useMemo, useRef, useState } from "react";

import { chayaSurfaceCardPaddedClass } from "@/components/menu-list-styles";

export type ComboChartPoint = {
  label: string;
  fullLabel?: string;
  bar: number;
  line: number;
  /** reserved for future comparison — not rendered yet */
  prevBar?: number;
};

type Props = {
  title: string;
  data: ComboChartPoint[];
  barAxisLabel: string;
  lineAxisLabel: string;
  formatYAxis?: (n: number) => string;
  formatBar?: (n: number) => string;
  formatLine?: (n: number) => string;
  barOnly?: boolean;
  tooltipKind?: "date" | "hour" | "weekday" | "menu";
  /** 차트 하단에 표시할 칩 (피크 or 인사이트) */
  footerChip?: { icon: string; text: string; kind: "peak" | "insight" };
  /** X축 레이블을 간격 없이 전체 표시 */
  showAllLabels?: boolean;
};

// ─── 레이아웃 ──────────────────────────────────────────────────
// viewBox를 모바일 실제 폭(~380px)에 가깝게 설정 → 폰트가 화면에서 그대로 읽힘
const VB_W = 380;
const VB_H = 300;
// PAD: 충분한 Y축 공간 확보
const PAD = { top: 24, right: 48, bottom: 54, left: 56 };

const TOOLTIP_W = 200;
const TOOLTIP_H = 74;

// ─── 유틸 ──────────────────────────────────────────────────────
/** Y축 눈금: 압축 표기 (소수 없이) */
function fmtShort(n: number): string {
  if (n >= 100_000_000) return `${Math.round(n / 100_000_000)}억`;
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}천만`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}백만`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return String(n);
}

function niceMax(n: number): number {
  if (n <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const f = n / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
}

function yTicks(max: number, count = 4): number[] {
  const m = niceMax(max);
  const step = m / count;
  return Array.from({ length: count + 1 }, (_, i) => Math.round(step * i));
}

/**
 * 데이터 개수에 따른 X축 레이블 간격.
 * 목표: 화면에 4~5개 레이블이 표시되도록.
 * 레이블은 마지막 인덱스를 기준으로 역산해서 표시 (마지막 날이 항상 보임).
 */
function xStep(n: number): number {
  if (n <= 1) return 1;
  if (n <= 4) return 1;   // 1~4개: 전체 표시
  if (n <= 7) return 3;   // 7일: 3일 간격 → 05/21, 05/24, 05/27 (3개)
  if (n <= 14) return 4;  // 14일: 4일 간격 → ~4개
  if (n <= 21) return 5;  // 21일: 5일 간격 → ~5개
  if (n <= 31) return 7;  // 30일: 7일(주) 간격 → ~5개
  return Math.ceil(n / 5);
}

// ──────────────────────────────────────────────────────────────
export function MerchantComboChart({
  title,
  data,
  barAxisLabel,
  lineAxisLabel,
  formatYAxis = fmtShort,
  formatBar = fmtShort,
  formatLine = (n) => String(n),
  barOnly = false,
  footerChip,
  showAllLabels = false,
}: Props) {
  const clipId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const layout = useMemo(() => {
    const maxBar = Math.max(1, ...data.map((d) => d.bar));
    const maxLine = barOnly ? 1 : Math.max(1, ...data.map((d) => d.line));
    const innerW = VB_W - PAD.left - PAD.right;
    const innerH = VB_H - PAD.top - PAD.bottom;
    const n = Math.max(data.length, 1);
    const band = innerW / n;
    const barW = Math.max(8, Math.min(36, band * 0.6));
    const step = xStep(n);
    // 막대 위 값: 7개 이하일 때만
    const showValueLabel = n <= 7;
    const lastIdx = n - 1;

    const points = data.map((d, i) => {
      const cx = PAD.left + band * i + band / 2;
      const barH = Math.max(0, (d.bar / niceMax(maxBar)) * innerH);
      const lineY = barOnly
        ? 0
        : PAD.top + innerH - (d.line / niceMax(maxLine)) * innerH;
      const barY = PAD.top + innerH - barH;

      // 툴팁 위치: 막대 위, X 클램핑
      let ttx = cx - TOOLTIP_W / 2;
      if (ttx < PAD.left) ttx = PAD.left;
      if (ttx + TOOLTIP_W > VB_W - PAD.right) ttx = VB_W - PAD.right - TOOLTIP_W;
      const tty = Math.max(PAD.top, barY - TOOLTIP_H - 10);

      // 마지막 날짜(lastIdx)를 기준으로 역산해 레이블 표시
      // → 항상 마지막 날짜가 보이고, 그로부터 step 간격으로 앞쪽에 레이블 배치
      // showAllLabels=true 이면 모든 레이블 표시
      const showLabel = showAllLabels ? true : (lastIdx - i) % step === 0;

      return { ...d, cx, barX: cx - barW / 2, barY, barH, barW, lineY, ttx, tty, showLabel };
    });

    const linePath =
      points.length > 1
        ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx} ${p.lineY}`).join(" ")
        : "";

    return {
      maxBar, maxLine, innerH, points, linePath,
      barTicks: yTicks(maxBar),
      lineTicks: barOnly ? [] : yTicks(maxLine),
      showValueLabel,
    };
  }, [barOnly, data, showAllLabels]);

  const empty = data.length === 0 || data.every((d) => d.bar === 0 && d.line === 0);
  const activePoint = active != null ? layout.points[active] : null;

  /** SVG 좌표로 변환해 가장 가까운 막대 인덱스 반환 */
  const svgXToIndex = (clientX: number): number | null => {
    const el = svgRef.current;
    if (!el || layout.points.length === 0) return null;
    const rect = el.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * VB_W;
    // 각 막대 중심까지 거리 비교
    let best = 0;
    let bestDist = Infinity;
    layout.points.forEach((p, i) => {
      const d = Math.abs(p.cx - svgX);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    // 차트 영역 밖이면 null
    if (svgX < PAD.left || svgX > VB_W - PAD.right) return null;
    return best;
  };

  const handlePointerMove = (clientX: number) => {
    const idx = svgXToIndex(clientX);
    if (idx != null) setActive(idx);
  };

  return (
    <section className={chayaSurfaceCardPaddedClass} aria-label={title}>
      {/* ── 헤더 ── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <span className="inline-block h-3 w-3 rounded-sm bg-chaya-primary dark:bg-orange-500" />
            {barAxisLabel}
          </span>
          {!barOnly ? (
            <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <span className="inline-block h-0.5 w-5 rounded bg-sky-500 dark:bg-sky-400" />
              {lineAxisLabel}
            </span>
          ) : null}
        </div>
      </div>

      {empty ? (
        <p className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
          이 기간에 데이터가 없습니다.
        </p>
      ) : (
        /**
         * SVG viewBox = 380 × 300 (모바일 실제 폭에 근접)
         * → 폰트 크기가 축소 없이 화면에서 그대로 표시됨
         * overflow-x 스크롤 없음
         */
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          role="img"
          aria-label={`${title} 차트`}
          style={{ touchAction: "pan-y" }}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseLeave={() => setActive(null)}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (t) handlePointerMove(t.clientX);
          }}
          onTouchEnd={() => setActive(null)}
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x={PAD.left} y={PAD.top}
                width={VB_W - PAD.left - PAD.right}
                height={VB_H - PAD.top - PAD.bottom}
              />
            </clipPath>
          </defs>

          {/* ── 수평 그리드 + 좌측 Y축 ── */}
          {layout.barTicks.map((tick) => {
            const y = PAD.top + layout.innerH - (tick / niceMax(layout.maxBar)) * layout.innerH;
            return (
              <g key={`g-${tick}`}>
                <line
                  x1={PAD.left} x2={VB_W - PAD.right} y1={y} y2={y}
                  stroke="#e4e4e7" strokeWidth={1}
                  className="dark:stroke-zinc-700"
                />
                {/* Y축 눈금: 14px — 모바일에서 충분히 읽힘 */}
                <text x={PAD.left - 6} y={y + 5} textAnchor="end"
                  fill="#71717a" fontSize={14} className="dark:fill-zinc-400">
                  {formatYAxis(tick)}
                </text>
              </g>
            );
          })}

          {/* ── 우측 Y축 (주문수) ── */}
          {!barOnly ? layout.lineTicks.map((tick) => {
            const y = PAD.top + layout.innerH - (tick / niceMax(layout.maxLine)) * layout.innerH;
            return (
              <text key={`r-${tick}`} x={VB_W - PAD.right + 5} y={y + 5} textAnchor="start"
                fill="#0ea5e9" fontSize={13} className="dark:fill-sky-400">
                {formatLine(tick)}
              </text>
            );
          }) : null}

          {/* ── 선택 가이드 라인 ── */}
          {active != null && layout.points[active] ? (
            <line
              x1={layout.points[active]!.cx} x2={layout.points[active]!.cx}
              y1={PAD.top} y2={PAD.top + layout.innerH}
              stroke="#d4d4d8" strokeWidth={1} strokeDasharray="4 3"
              className="dark:stroke-zinc-600"
            />
          ) : null}

          <g clipPath={`url(#${clipId})`}>
            {/* ── 막대 ── */}
            {layout.points.map((p, i) => (
              <rect key={`b-${i}`}
                x={p.barX} y={p.barY} width={p.barW} height={p.barH} rx={4}
                className="fill-chaya-primary dark:fill-orange-500"
                opacity={active == null || active === i ? 1 : 0.3}
                style={{ cursor: "pointer" }}
              />
            ))}

            {/* ── 꺾은선 ── */}
            {!barOnly && layout.linePath ? (
              <path d={layout.linePath} fill="none"
                stroke="#0ea5e9" strokeWidth={2.5}
                strokeLinejoin="round" strokeLinecap="round"
                className="dark:stroke-sky-400"
              />
            ) : null}

            {/* ── 꺾은선 점 ── */}
            {!barOnly ? layout.points.map((p, i) => (
              <circle key={`c-${i}`} cx={p.cx} cy={p.lineY}
                r={active === i ? 6 : 4}
                fill="#0ea5e9" stroke="white" strokeWidth={2}
                className="fill-sky-500 stroke-white dark:fill-sky-400 dark:stroke-zinc-950"
              />
            )) : null}
          </g>

          {/* ── X축 레이블: 15px, 간격 조절 ── */}
          {layout.points.map((p, i) =>
            p.showLabel ? (
              <text key={`x-${i}`} x={p.cx} y={VB_H - 10} textAnchor="middle"
                fill={active === i ? "#18181b" : "#71717a"}
                className={active === i ? "dark:fill-zinc-100" : "dark:fill-zinc-400"}
                fontSize={15} fontWeight={active === i ? 700 : 500}>
                {p.label}
              </text>
            ) : null
          )}

          {/* ── 막대 위 값 라벨 (≤10개일 때) ── */}
          {layout.showValueLabel ? layout.points.map((p, i) =>
            p.bar > 0 ? (
              <text key={`vl-${i}`} x={p.cx} y={p.barY - 6} textAnchor="middle"
                fill={active === i ? "#ea580c" : "#a1a1aa"}
                className={active === i ? "dark:fill-orange-400" : "dark:fill-zinc-500"}
                fontSize={13} fontWeight={700}>
                {fmtShort(p.bar)}
              </text>
            ) : null
          ) : null}

          {/* ── 툴팁 카드 (막대 위) ── */}
          {activePoint ? (() => {
            const p = activePoint;
            const barStr = formatBar(p.bar);
            const lineStr = !barOnly && p.line > 0 ? formatLine(p.line) : null;
            const boxH = TOOLTIP_H;

            return (
              <g>
                {/* 배경 */}
                <rect x={p.ttx} y={p.tty} width={TOOLTIP_W} height={boxH} rx={10}
                  fill="#18181b" opacity={0.93} className="dark:fill-zinc-700" />
                {/* 꼬리 */}
                <polygon
                  points={`${p.cx - 8},${p.tty + boxH} ${p.cx + 8},${p.tty + boxH} ${p.cx},${p.tty + boxH + 9}`}
                  fill="#18181b" opacity={0.93} className="dark:fill-zinc-700" />

                {/* 날짜/시간 라벨 — 15px */}
                <text x={p.ttx + TOOLTIP_W / 2} y={p.tty + 22} textAnchor="middle"
                  fill="rgba(255,255,255,0.7)" fontSize={15}>
                  {p.fullLabel ?? p.label}
                </text>

                {/* 매출 — 22px 굵게 */}
                <text x={p.ttx + TOOLTIP_W / 2} y={p.tty + 48} textAnchor="middle"
                  fill="white" fontSize={22} fontWeight={800}>
                  {barStr}
                </text>

                {/* 주문 수 — 15px */}
                {lineStr ? (
                  <text x={p.ttx + TOOLTIP_W / 2} y={p.tty + 67} textAnchor="middle"
                    fill="#93c5fd" fontSize={15} fontWeight={600}>
                    {lineStr}
                  </text>
                ) : null}
              </g>
            );
          })() : null}
        </svg>
      )}

      {/* 피크/인사이트 칩 */}
      {footerChip ? (
        <div
          className={[
            "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold",
            footerChip.kind === "peak"
              ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
              : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
          ].join(" ")}
        >
          <span>{footerChip.icon}</span>
          {footerChip.text}
        </div>
      ) : null}
    </section>
  );
}
