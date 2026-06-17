"use client";

import { MerchantComboChart } from "@/components/merchant-combo-chart";

type AnalyticsChartsProps = {
  daily: { label: string; fullLabel: string; orders: number; sales: number }[];
  prevDaily: { orders: number; sales: number }[];
  hourly: { label: string; orders: number; sales: number }[];
  byWeekday: { label: string; orders: number; sales: number }[];
  topMenus: { name: string; qty: number }[];
  cancelReasons: { reason: string; label: string; count: number }[];
  days: number;
};

// ── 포매터 ─────────────────────────────────────────────────────
function fmtY(n: number): string {
  if (n === 0) return "0";
  if (n >= 100_000_000) return `${Math.round(n / 100_000_000)}억`;
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}천만`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}백만`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return String(n);
}

function fmtWon(n: number): string {
  if (n >= 10_000) {
    const man = n / 10_000;
    if (Number.isInteger(man)) return `${man}만원`;
    const s = man.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `${s}만원`;
  }
  return `${n.toLocaleString("ko-KR")}원`;
}

// ── 요일명 추출 (fullLabel에서) ───────────────────────────────
// fullLabel 예: "05/23(금)", "05/29(목)" → "금", "목"
function extractDow(fullLabel: string, label: string): string {
  const m = fullLabel.match(/[（(]([월화수목금토일])[）)]/);
  if (m?.[1]) return m[1];
  return label; // fallback: label 그대로
}

// ── 피크 계산 ─────────────────────────────────────────────────
function findPeakHour(hourly: { label: string; sales: number }[]): string | null {
  if (!hourly.length) return null;
  let maxSales = 0;
  let peakLabel = "";
  for (const h of hourly) {
    if (h.sales > maxSales) { maxSales = h.sales; peakLabel = h.label; }
  }
  return maxSales > 0 ? peakLabel : null;
}

function findBestWeekday(byWeekday: { label: string; sales: number }[]): string | null {
  if (!byWeekday.length) return null;
  let maxSales = 0;
  let bestLabel = "";
  for (const w of byWeekday) {
    if (w.sales > maxSales) { maxSales = w.sales; bestLabel = w.label; }
  }
  return maxSales > 0 ? bestLabel : null;
}

function findBestDay(daily: { label: string; fullLabel: string; sales: number }[]): string | null {
  if (!daily.length) return null;
  let maxSales = 0;
  let bestLabel = "";
  for (const d of daily) {
    if (d.sales > maxSales) { maxSales = d.sales; bestLabel = d.fullLabel ?? d.label; }
  }
  return maxSales > 0 ? bestLabel : null;
}

// ── 주차별 집계 (30일 뷰) ─────────────────────────────────────
function buildWeeklyData(daily: { label: string; fullLabel: string; orders: number; sales: number }[]) {
  const weeks: { label: string; fullLabel: string; orders: number; sales: number }[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7);
    const wOrders = chunk.reduce((s, d) => s + d.orders, 0);
    const wSales = chunk.reduce((s, d) => s + d.sales, 0);
    const wn = Math.floor(i / 7) + 1;
    const first = chunk[0]?.label ?? "";
    const last = chunk[chunk.length - 1]?.label ?? "";
    weeks.push({
      label: `${wn}주`,
      fullLabel: `${wn}주차 (${first}~${last})`,
      orders: wOrders,
      sales: wSales,
    });
  }
  return weeks;
}

// ── 인기 메뉴 Top3 ─────────────────────────────────────────────
const RANK_STYLES = [
  { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-500" },  // 1위
  { bg: "bg-zinc-100 dark:bg-zinc-800",     text: "text-zinc-500" },   // 2위
  { bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-500" }, // 3위
];

function TopMenusCard({
  topMenus,
  unitLabel,
}: {
  topMenus: { name: string; qty: number }[];
  unitLabel: string;
}) {
  const top3 = topMenus.slice(0, 3);
  if (top3.length === 0) return null;
  const maxQty = Math.max(...top3.map((m) => m.qty), 1);

  return (
    <section
      className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900"
      aria-label="인기 메뉴 Top 3"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-[14px] font-extrabold text-zinc-900 dark:text-zinc-50">
          🏆 인기 메뉴 Top 3
        </h2>
        <span className="text-[11px] font-medium text-zinc-400">{unitLabel}</span>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {top3.map((menu, idx) => {
          const style = RANK_STYLES[idx] ?? RANK_STYLES[2]!;
          const barPct = Math.round((menu.qty / maxQty) * 100);
          return (
            <div key={menu.name} className="flex items-center gap-3 px-4 py-3">
              {/* 순위 배지 */}
              <div
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[14px] font-black",
                  style.bg,
                  style.text,
                ].join(" ")}
              >
                {idx + 1}
              </div>

              {/* 메뉴명 + 바 */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-zinc-900 dark:text-zinc-50">
                  {menu.name}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-chaya-primary dark:bg-orange-500"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>

              {/* 판매 수 */}
              <div className="shrink-0 text-right">
                <span className="text-[17px] font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {menu.qty.toLocaleString("ko-KR")}
                </span>
                <span className="ml-0.5 text-[11px] font-semibold text-zinc-400">개</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export function MerchantAnalyticsCharts({
  daily,
  prevDaily,
  hourly,
  byWeekday,
  topMenus,
  cancelReasons,
  days,
}: AnalyticsChartsProps) {
  const peakHour = findPeakHour(hourly);
  const bestWeekday = findBestWeekday(byWeekday);

  // ── 오늘 뷰: 시간대 + Top3 ──────────────────────────────────
  if (days === 1) {
    return (
      <div className="merchant-analytics-charts-stack">
        <MerchantComboChart
          title="⏰ 시간대별 매출"
          data={hourly.map((h) => ({
            label: h.label.replace("시", ""),
            fullLabel: h.label,
            bar: h.sales,
            line: h.orders,
          }))}
          barAxisLabel="매출"
          lineAxisLabel="주문"
          formatYAxis={fmtY}
          formatBar={fmtWon}
          formatLine={(n) => `${n}건`}
          footerChip={peakHour ? { icon: "🔥", text: `피크: ${peakHour}`, kind: "peak" } : undefined}
        />

        <TopMenusCard topMenus={topMenus} unitLabel="오늘 기준" />

        {cancelReasons.length > 0 ? (
          <MerchantComboChart
            title={`취소 사유 (총 ${cancelReasons.reduce((s, r) => s + r.count, 0)}건)`}
            data={cancelReasons.map((r) => ({
              label: r.label,
              fullLabel: r.label,
              bar: r.count,
              line: 0,
            }))}
            barAxisLabel="취소 건수"
            lineAxisLabel=""
            formatYAxis={(n) => `${n}건`}
            formatBar={(n) => `${n}건`}
            barOnly
          />
        ) : null}
      </div>
    );
  }

  // ── 7일 뷰: 일별 + 요일별 + 시간대 + Top3 ─────────────────
  if (days === 7) {
    const bestDay = findBestDay(daily);
    return (
      <div className="merchant-analytics-charts-stack">
        {/* 일별 매출 */}
        <MerchantComboChart
          title="📅 일별 매출"
          data={daily.map((d, i) => ({
            label: d.label,
            fullLabel: d.fullLabel ?? d.label,
            bar: d.sales,
            line: d.orders,
            prevBar: prevDaily[i]?.sales,
          }))}
          barAxisLabel="매출"
          lineAxisLabel="주문"
          formatYAxis={fmtY}
          formatBar={fmtWon}
          formatLine={(n) => `${n}건`}
          footerChip={bestDay ? { icon: "💡", text: `이번 주 최고: ${bestDay}`, kind: "insight" } : undefined}
        />

        {/* 요일별 집계 — 실제 날짜 순서(오늘 기준 7일), 전체 레이블 표시 */}
        <MerchantComboChart
          title="📊 요일별 집계"
          data={daily.map((d) => ({
            label: extractDow(d.fullLabel ?? d.label, d.label),
            fullLabel: d.fullLabel ?? d.label,
            bar: d.sales,
            line: d.orders,
          }))}
          barAxisLabel="매출"
          lineAxisLabel="주문"
          formatYAxis={fmtY}
          formatBar={fmtWon}
          formatLine={(n) => `${n}건`}
          showAllLabels
          footerChip={bestWeekday ? { icon: "💡", text: `${bestWeekday} 매출이 가장 높아요`, kind: "insight" } : undefined}
        />

        {/* 시간대별 평균 */}
        <MerchantComboChart
          title="⏰ 시간대별 평균"
          data={hourly.map((h) => ({
            label: h.label.replace("시", ""),
            fullLabel: h.label,
            bar: h.sales,
            line: h.orders,
          }))}
          barAxisLabel="매출"
          lineAxisLabel="주문"
          formatYAxis={fmtY}
          formatBar={fmtWon}
          formatLine={(n) => `${n}건`}
          footerChip={peakHour ? { icon: "🔥", text: `7일 평균 피크: ${peakHour}`, kind: "peak" } : undefined}
        />

        <TopMenusCard topMenus={topMenus} unitLabel="최근 7일 기준" />

        {cancelReasons.length > 0 ? (
          <MerchantComboChart
            title={`취소 사유 (총 ${cancelReasons.reduce((s, r) => s + r.count, 0)}건)`}
            data={cancelReasons.map((r) => ({
              label: r.label,
              fullLabel: r.label,
              bar: r.count,
              line: 0,
            }))}
            barAxisLabel="취소 건수"
            lineAxisLabel=""
            formatYAxis={(n) => `${n}건`}
            formatBar={(n) => `${n}건`}
            barOnly
          />
        ) : null}
      </div>
    );
  }

  // ── 30일 / 이번달 / 지난달 뷰: 주차별 + 요일별 + 시간대 + Top3 ─
  const weeklyData = buildWeeklyData(daily);
  const periodTitle = `최근 ${days}일`;

  return (
    <div className="merchant-analytics-charts-stack">
      {/* 주차별 매출 */}
      {weeklyData.length > 0 ? (
        <MerchantComboChart
          title="📅 주차별 매출"
          data={weeklyData.map((w) => ({
            label: w.label,
            fullLabel: w.fullLabel,
            bar: w.sales,
            line: w.orders,
          }))}
          barAxisLabel="매출"
          lineAxisLabel="주문"
          formatYAxis={fmtY}
          formatBar={fmtWon}
          formatLine={(n) => `${n}건`}
          footerChip={
            weeklyData.length > 0
              ? (() => {
                  const best = weeklyData.reduce((a, b) => (b.sales > a.sales ? b : a), weeklyData[0]!);
                  return { icon: "💡", text: `${best.label}가 최고 매출 주차예요`, kind: "insight" as const };
                })()
              : undefined
          }
        />
      ) : (
        <MerchantComboChart
          title={`${periodTitle} 매출`}
          data={daily.map((d, i) => ({
            label: d.label,
            fullLabel: d.fullLabel ?? d.label,
            bar: d.sales,
            line: d.orders,
            prevBar: prevDaily[i]?.sales,
          }))}
          barAxisLabel="매출"
          lineAxisLabel="주문"
          formatYAxis={fmtY}
          formatBar={fmtWon}
          formatLine={(n) => `${n}건`}
        />
      )}

      {/* 요일별 집계 */}
      <MerchantComboChart
        title="📊 요일별 집계"
        data={byWeekday.map((w) => ({
          label: w.label.replace("요일", ""),
          fullLabel: w.label,
          bar: w.sales,
          line: w.orders,
        }))}
        barAxisLabel="매출"
        lineAxisLabel="주문"
        formatYAxis={fmtY}
        formatBar={fmtWon}
        formatLine={(n) => `${n}건`}
        footerChip={bestWeekday ? { icon: "💡", text: `${bestWeekday} 매출이 꾸준히 강세예요`, kind: "insight" } : undefined}
      />

      {/* 시간대별 평균 */}
      <MerchantComboChart
        title="⏰ 시간대별 평균"
        data={hourly.map((h) => ({
          label: h.label.replace("시", ""),
          fullLabel: h.label,
          bar: h.sales,
          line: h.orders,
        }))}
        barAxisLabel="매출"
        lineAxisLabel="주문"
        formatYAxis={fmtY}
        formatBar={fmtWon}
        formatLine={(n) => `${n}건`}
        footerChip={peakHour ? { icon: "🔥", text: `${days}일 평균 피크: ${peakHour}`, kind: "peak" } : undefined}
      />

      <TopMenusCard topMenus={topMenus} unitLabel={`${periodTitle} 기준`} />

      {cancelReasons.length > 0 ? (
        <MerchantComboChart
          title={`취소 사유 (총 ${cancelReasons.reduce((s, r) => s + r.count, 0)}건)`}
          data={cancelReasons.map((r) => ({
            label: r.label,
            fullLabel: r.label,
            bar: r.count,
            line: 0,
          }))}
          barAxisLabel="취소 건수"
          lineAxisLabel=""
          formatYAxis={(n) => `${n}건`}
          formatBar={(n) => `${n}건`}
          barOnly
        />
      ) : null}
    </div>
  );
}
