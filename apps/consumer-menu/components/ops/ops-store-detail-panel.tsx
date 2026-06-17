"use client";

import Link from "next/link";

import { OpsBadge, healthBarColor, healthScoreColor, healthScoreTone } from "@/components/ops/ops-ui";
import { opsDesktopOnlyClass } from "@/lib/responsive/chaya-ops-shell";
import type { PlatformStoreSummary } from "@/lib/platform/list-platform-stores";

const STATUS_BADGE: Record<
  PlatformStoreSummary["operatingStatus"],
  { label: string; tone: "green" | "orange" | "blue" | "indigo" }
> = {
  active: { label: "영업중", tone: "green" },
  idle: { label: "대기", tone: "indigo" },
  new: { label: "신규", tone: "blue" },
  setup: { label: "셋업 중", tone: "orange" },
};

function formatWhenShort(iso: string | null): string {
  if (!iso) return "없음";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "없음";
  const days = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 14) return `${days}일 전`;
  return `${days}일+`;
}

type Props = {
  store: PlatformStoreSummary;
  onClose: () => void;
  /** 가로 2-pane — 슬라이드오버 대신 인라인 패널 */
  embedded?: boolean;
};

/** 목업 `.detail-panel` — PC 매장 슬라이드인 또는 2-pane 인라인 */
export function OpsStoreDetailPanel({ store, onClose, embedded = false }: Props) {
  const tone = healthScoreTone(store.health.score);
  const st = STATUS_BADGE[store.operatingStatus];
  const badges = [
    st.label,
    `메뉴 ${store.menuCount}개`,
    store.activeTableCount > 0 ? "QR 활성" : "QR 미설정",
  ];
  if (store.atRisk) badges.unshift("⚠️ 요주의");

  const kpis = [
    {
      val: `₩${store.todaySales.toLocaleString("ko-KR")}`,
      lbl: "오늘 매출",
      chg: store.todayOrderCount > 0 ? `${store.todayOrderCount}건` : "—",
      cls: "",
    },
    {
      val: `${store.todayOrderCount}건`,
      lbl: "오늘 주문",
      chg: `7일 ${store.ordersLast7d}건`,
      cls: "",
    },
    {
      val:
        store.todayOrderCount > 0
          ? `₩${Math.round(store.todaySales / store.todayOrderCount).toLocaleString("ko-KR")}`
          : "—",
      lbl: "객단가",
      chg: formatWhenShort(store.lastMerchantActivityAt),
      cls: store.atRisk ? "text-[#F05252]" : "",
    },
  ];

  const body = (
    <>
        <div className="sticky top-0 z-[1] flex items-start justify-between border-b border-ops-border bg-ops-surface px-6 py-5">
          <div>
            <p className="text-lg font-black text-ops-text">{store.displayName}</p>
            <p className="mt-1 text-xs font-medium text-[#4A5568]">
              {store.tenantSlug}
              {store.firstMemberAt ? ` · 가입 ${store.firstMemberAt.slice(0, 10)}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {badges.map((b) => (
                <OpsBadge key={b} tone="indigo">
                  {b}
                </OpsBadge>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-ops-surface-3 text-ops-muted transition hover:text-ops-text"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5 pb-9">
          <div>
            <p className="mb-2 text-[11px] font-bold tracking-wide text-[#4A5568] uppercase">건강 점수</p>
            <div className="flex items-center gap-3">
              <span className={`text-[32px] font-black tabular-nums ${healthScoreColor(tone)}`}>
                {store.health.score}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ops-surface-3">
                <div
                  className={`h-full rounded-full ${healthBarColor(tone)}`}
                  style={{ width: `${store.health.score}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold tracking-wide text-[#4A5568] uppercase">핵심 지표</p>
            <div className="grid grid-cols-3 gap-2">
              {kpis.map((k) => (
                <div
                  key={k.lbl}
                  className="rounded-lg border border-ops-border bg-ops-surface-2 px-3 py-3 text-center"
                >
                  <p className="text-base font-black tabular-nums text-ops-text">{k.val}</p>
                  <p className="mt-1 text-[10px] font-semibold text-[#4A5568]">{k.lbl}</p>
                  {k.chg ? (
                    <p className={`mt-0.5 text-[10px] font-bold ${k.cls || "text-[#22D3A0]"}`}>{k.chg}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold tracking-wide text-[#4A5568] uppercase">액션</p>
            <div className="flex gap-2">
              <Link
                href={`/ops/stores/${encodeURIComponent(store.tenantSlug)}`}
                className="flex-1 rounded-lg border border-[rgba(91,107,248,0.3)] bg-[rgba(91,107,248,0.18)] px-2 py-2 text-center text-xs font-bold text-[#5B6BF8] transition hover:bg-[rgba(91,107,248,0.25)]"
              >
                상세 페이지
              </Link>
              <Link
                href={`/m/${encodeURIComponent(store.tenantSlug)}/dashboard`}
                className="flex-1 rounded-lg border border-ops-border bg-ops-surface-2 px-2 py-2 text-center text-xs font-bold text-ops-muted transition hover:bg-ops-surface-3 hover:text-ops-text"
              >
                점주앱
              </Link>
            </div>
          </div>

          {store.onboardingFlags.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-bold tracking-wide text-[#4A5568] uppercase">온보딩</p>
              <ul className="space-y-2">
                {store.onboardingFlags.map((flag) => (
                  <li key={flag} className="flex items-start gap-2 border-t border-ops-border pt-2 text-xs font-semibold text-ops-muted first:border-t-0 first:pt-0">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F7983A]" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
    </>
  );

  if (embedded) {
    return (
      <aside className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border border-ops-border bg-ops-surface shadow-sm">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-none">{body}</div>
      </aside>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-[500] bg-black/50 ${opsDesktopOnlyClass}`}
        aria-label="패널 닫기"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 bottom-0 z-[501] flex w-full max-w-[420px] flex-col overflow-y-auto border-l border-ops-border-2 bg-ops-surface scrollbar-none">
        {body}
      </aside>
    </>
  );
}
