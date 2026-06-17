"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { OpsDataTable, OpsDataTableBody, OpsDataTableHead } from "@/components/ops/ops-data-table";
import { OpsStoreDetailPanel } from "@/components/ops/ops-store-detail-panel";
import { OpsBadge, OpsPageHero, healthBarColor, healthScoreColor, healthScoreTone } from "@/components/ops/ops-ui";
import type { PlatformStoreSummary } from "@/lib/platform/list-platform-stores";
import {
  opsCompactOnlyClass,
  opsDesktopOnlyClass,
  opsStoresDetailPaneClass,
  opsStoresListPaneClass,
  opsStoresTwoPaneClass,
} from "@/lib/responsive/chaya-ops-shell";
import { useOpsWideLandscape } from "@/lib/responsive/use-ops-wide-landscape";

type Filter = "all" | "active" | "setup" | "at_risk" | "new";
type Sort = "health" | "sales" | "name";

const STATUS_BADGE: Record<
  PlatformStoreSummary["operatingStatus"],
  { label: string; tone: "green" | "orange" | "blue" | "indigo" }
> = {
  active: { label: "영업중", tone: "green" },
  idle: { label: "대기", tone: "indigo" },
  new: { label: "신규", tone: "blue" },
  setup: { label: "셋업 중", tone: "orange" },
};

const AVATAR_BG = [
  "bg-[rgba(34,211,160,0.12)]",
  "bg-[rgba(91,107,248,0.12)]",
  "bg-[rgba(240,82,82,0.12)]",
  "bg-[rgba(247,152,58,0.12)]",
  "bg-[rgba(56,189,248,0.12)]",
];

const AVATAR_EMOJI = ["🍱", "🍜", "🍲", "🌶", "🥘", "🍛", "🥗", "🍝"];

function storeEmoji(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h + slug.charCodeAt(i)) % AVATAR_EMOJI.length;
  return AVATAR_EMOJI[h] ?? "🍱";
}

function avatarBg(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h + slug.charCodeAt(i)) % AVATAR_BG.length;
  return AVATAR_BG[h] ?? AVATAR_BG[0];
}

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
  stores: PlatformStoreSummary[];
};

export function OpsStoreListClient({ stores }: Props) {
  const searchParams = useSearchParams();
  const wideLandscape = useOpsWideLandscape();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("health");
  const [detailStore, setDetailStore] = useState<PlatformStoreSummary | null>(null);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  const activeCount = stores.filter((s) => s.operatingStatus === "active").length;
  const atRiskCount = stores.filter((s) => s.atRisk).length;
  const newCount = stores.filter((s) => s.operatingStatus === "new").length;
  const inactiveCount = stores.filter((s) => s.operatingStatus === "idle" || s.operatingStatus === "setup").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = stores.filter((s) => {
      if (filter === "active" && s.operatingStatus !== "active") return false;
      if (filter === "setup" && s.onboardingPercent >= 100) return false;
      if (filter === "at_risk" && !s.atRisk) return false;
      if (filter === "new" && s.operatingStatus !== "new") return false;
      if (!q) return true;
      return s.tenantSlug.toLowerCase().includes(q) || s.displayName.toLowerCase().includes(q);
    });

    return [...list].sort((a, b) => {
      if (sort === "health") return a.health.score - b.health.score || a.displayName.localeCompare(b.displayName);
      if (sort === "sales") return b.todaySales - a.todaySales;
      return a.displayName.localeCompare(b.displayName);
    });
  }, [stores, query, filter, sort]);

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: `전체 ${stores.length}` },
    { id: "active", label: `영업중 ${activeCount}` },
    { id: "at_risk", label: `⚠️ 위험 ${atRiskCount}` },
    { id: "new", label: `신규 ${newCount}` },
    { id: "setup", label: `미활성 ${inactiveCount}` },
  ];

  const toolbar = (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className={`flex w-full max-w-[260px] items-center gap-2 rounded-lg border border-ops-border bg-ops-surface px-3.5 py-2 focus-within:border-[#5B6BF8] ${wideLandscape ? "max-w-none flex-1" : ""}`}>
        <span className="text-[13px] text-ops-muted" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="매장 이름, 지역 검색"
          className="w-full bg-transparent text-[13px] font-medium text-ops-text outline-none placeholder:text-[#4A5568]"
          aria-label="매장 검색"
        />
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="필터">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition",
              filter === c.id
                ? "border-[rgba(91,107,248,0.35)] bg-[rgba(91,107,248,0.18)] text-[#5B6BF8]"
                : "border-ops-border bg-ops-surface text-[#4A5568] hover:border-ops-border-2 hover:text-ops-muted",
            ].join(" ")}
          >
            {c.label}
          </button>
        ))}
      </div>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value as Sort)}
        className={`rounded-lg border border-ops-border bg-ops-surface px-2 py-1.5 text-xs font-semibold text-ops-subtle ${opsDesktopOnlyClass}`}
        aria-label="정렬"
      >
        <option value="health">건강 점수 낮은 순</option>
        <option value="sales">오늘 매출 순</option>
        <option value="name">이름 순</option>
      </select>
      <Link
        href="/ops/stores/export"
        className={[
          "rounded-md border border-ops-border bg-ops-surface-2 px-3 py-1.5 text-[11px] font-bold text-ops-muted transition hover:border-ops-border-2 hover:text-ops-text",
          wideLandscape ? "" : "ml-auto",
        ].join(" ")}
      >
        📤 CSV 내보내기
      </Link>
    </div>
  );

  return (
    <div>
      <OpsPageHero
        title="매장 관리"
        subtitle={`전체 ${stores.length}개 매장 · 건강점수 및 실시간 지표`}
      />

      {toolbar}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ops-border px-4 py-8 text-center text-sm text-ops-muted">
          조건에 맞는 매장이 없습니다.
        </p>
      ) : wideLandscape && detailStore ? (
        <div className={opsStoresTwoPaneClass}>
          <div className={opsStoresListPaneClass}>
            <ul className="space-y-2" aria-label="매장 목록">
              {filtered.map((s) => {
                const tone = healthScoreTone(s.health.score);
                const selected = detailStore.tenantSlug === s.tenantSlug;
                return (
                  <li key={s.tenantSlug}>
                    <button
                      type="button"
                      onClick={() => setDetailStore(s)}
                      className={[
                        "flex w-full min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
                        selected
                          ? "border-[rgba(91,107,248,0.45)] bg-[rgba(91,107,248,0.12)] ring-2 ring-[#5B6BF8]/30"
                          : "border-ops-border bg-ops-surface hover:border-ops-border-2",
                      ].join(" ")}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${avatarBg(s.tenantSlug)}`}
                      >
                        {storeEmoji(s.tenantSlug)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ops-text">{s.displayName}</p>
                        <p className="truncate text-[11px] text-ops-muted">{s.tenantSlug}</p>
                      </div>
                      <span className={`text-sm font-black tabular-nums ${healthScoreColor(tone)}`}>
                        {s.health.score}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className={opsStoresDetailPaneClass}>
            <OpsStoreDetailPanel
              store={detailStore}
              onClose={() => setDetailStore(null)}
              embedded
            />
          </div>
        </div>
      ) : (
        <>
          <div className={opsDesktopOnlyClass}>
            <OpsDataTable>
              <OpsDataTableHead>
                <tr>
                  <th className="py-2.5 pr-4 pl-5">매장</th>
                  <th className="px-4 py-2.5">건강점수</th>
                  <th className="px-4 py-2.5">상태</th>
                  <th className="px-4 py-2.5">오늘 매출</th>
                  <th className="px-4 py-2.5">오늘 주문</th>
                  <th className="px-4 py-2.5">마지막 접속</th>
                  <th className="px-4 py-2.5">액션</th>
                </tr>
              </OpsDataTableHead>
              <OpsDataTableBody>
                {filtered.map((s) => {
                  const tone = healthScoreTone(s.health.score);
                  const st = STATUS_BADGE[s.operatingStatus];
                  return (
                    <tr
                      key={s.tenantSlug}
                      className="cursor-pointer border-b border-ops-border transition hover:bg-ops-surface-2 last:border-b-0"
                      onClick={() => setDetailStore(s)}
                    >
                      <td className="py-3 pr-4 pl-5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] text-base ${avatarBg(s.tenantSlug)}`}
                          >
                            {storeEmoji(s.tenantSlug)}
                          </div>
                          <div>
                            <p className="text-[13px] font-extrabold text-ops-text">{s.displayName}</p>
                            <p className="text-[11px] font-medium text-[#4A5568]">
                              {s.firstMemberAt ? `가입 ${s.firstMemberAt.slice(0, 10)} · ` : ""}
                              {s.tenantSlug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 text-right text-[15px] font-black tabular-nums ${healthScoreColor(tone)}`}>
                            {s.health.score}
                          </span>
                          <div className="h-1 w-20 overflow-hidden rounded-full bg-ops-surface-3">
                            <div
                              className={`h-full rounded-full ${healthBarColor(tone)}`}
                              style={{ width: `${s.health.score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <OpsBadge tone={s.atRisk ? "red" : st.tone}>
                          {s.atRisk ? "⚠️ 요주의" : st.label}
                        </OpsBadge>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] font-medium text-ops-text tabular-nums">
                        ₩{s.todaySales.toLocaleString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] font-medium text-ops-text tabular-nums">
                        {s.todayOrderCount}건
                      </td>
                      <td
                        className={`px-4 py-3 text-[13px] font-semibold ${s.atRisk ? "text-[#F7983A]" : "text-ops-text"}`}
                      >
                        {formatWhenShort(s.lastMerchantActivityAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="rounded-md border border-[rgba(91,107,248,0.3)] bg-[rgba(91,107,248,0.18)] px-3 py-1 text-[11px] font-bold text-[#5B6BF8] transition hover:bg-[rgba(91,107,248,0.25)]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailStore(s);
                          }}
                        >
                          상세 보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </OpsDataTableBody>
            </OpsDataTable>
          </div>

          <ul className={`space-y-3 ${opsCompactOnlyClass}`}>
            {filtered.map((s) => {
              const tone = healthScoreTone(s.health.score);
              const st = STATUS_BADGE[s.operatingStatus];
              const riskBadge = s.atRisk ? (
                <OpsBadge tone="red">⚠️ 요주의</OpsBadge>
              ) : s.health.score >= 80 ? (
                <OpsBadge tone="green">⭐ 우수</OpsBadge>
              ) : null;

              return (
                <li key={s.tenantSlug}>
                  <Link
                    href={`/ops/stores/${encodeURIComponent(s.tenantSlug)}`}
                    className="block rounded-xl border border-ops-border bg-ops-surface p-4 transition active:border-[rgba(91,107,248,0.35)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-lg ${avatarBg(s.tenantSlug)}`}
                        >
                          {storeEmoji(s.tenantSlug)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-extrabold text-ops-text">{s.displayName}</p>
                          <p className="truncate text-[11px] font-medium text-ops-muted">
                            {s.tenantSlug} · 메뉴 {s.menuCount}개
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-end justify-end gap-0.5">
                          <span className={`text-xl font-black tabular-nums ${healthScoreColor(tone)}`}>
                            {s.health.score}
                          </span>
                          <span className="pb-0.5 text-[10px] font-semibold text-ops-muted">점</span>
                        </div>
                        <div className="mt-1 flex flex-wrap justify-end gap-1">
                          <OpsBadge tone={st.tone}>{st.label}</OpsBadge>
                          {riskBadge}
                        </div>
                      </div>
                    </div>
                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ops-surface-3">
                      <div
                        className={`h-full rounded-full ${healthBarColor(tone)}`}
                        style={{ width: `${s.health.score}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-sm font-extrabold tabular-nums text-ops-text">
                          ₩{s.todaySales.toLocaleString("ko-KR")}
                        </p>
                        <p className="text-[10px] font-semibold text-ops-muted">오늘 매출</p>
                      </div>
                      <div>
                        <p className="text-sm font-extrabold tabular-nums text-ops-text">{s.todayOrderCount}건</p>
                        <p className="text-[10px] font-semibold text-ops-muted">오늘 주문</p>
                      </div>
                      <div>
                        <p
                          className={`text-sm font-extrabold ${s.atRisk ? "text-[#F7983A]" : "text-ops-text"}`}
                        >
                          {formatWhenShort(s.lastMerchantActivityAt)}
                        </p>
                        <p className="text-[10px] font-semibold text-ops-muted">마지막 접속</p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {detailStore && !wideLandscape ? (
        <OpsStoreDetailPanel store={detailStore} onClose={() => setDetailStore(null)} />
      ) : null}
    </div>
  );
}
