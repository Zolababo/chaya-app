"use client";

import Link from "next/link";
import { AlertTriangle, Bell, ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MerchantAnnouncementDetailSheet } from "@/components/merchant-announcement-detail-sheet";
import { MerchantEmptyState } from "@/components/merchant-empty-state";
import { MerchantLoadingCenter } from "@/components/merchant-loading-center";
import {
  getReadAnnouncementIds,
  markAllAnnouncementsRead,
  markAnnouncementRead,
  MERCHANT_ANNOUNCEMENT_READ_EVENT,
} from "@/lib/merchant/merchant-announcement-read";
import { chayaAppShellBleedClass } from "@/lib/responsive/chaya-app-shell";
import {
  ANNOUNCEMENT_TYPE_META,
  formatAnnouncementDateLabel,
  type AnnouncementFilter,
  type AnnouncementType,
  type PlatformAnnouncement,
} from "@/lib/merchant/platform-announcement";
import {
  merchantTabCountBadgeClass,
  merchantTabLinkClass,
  merchantTabRowClass,
} from "@/lib/merchant/merchant-tab-chrome";

type Props = {
  tenant: string;
  /** 4탭 셸 오버레이 — 풀 페이지 SSR 없이 표시 */
  embedded?: boolean;
  onClose?: () => void;
};

const FILTER_ORDER: AnnouncementFilter[] = ["all", "urgent", "notice", "update", "event"];

function parseAnnouncements(json: unknown): PlatformAnnouncement[] | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (o.ok !== true || !Array.isArray(o.items)) return null;
  return o.items as PlatformAnnouncement[];
}

export function MerchantAnnouncementsPageClient({ tenant, embedded = false, onClose: _onClose }: Props) {
  const t = encodeURIComponent(tenant);
  const [items, setItems] = useState<PlatformAnnouncement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AnnouncementFilter>("all");
  const [readVersion, setReadVersion] = useState(0);
  const [selected, setSelected] = useState<PlatformAnnouncement | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refreshReadState = useCallback(() => {
    setReadVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/m/${t}/live/announcements`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const json = (await res.json()) as unknown;
        if (cancelled) return;
        if (!res.ok) {
          const msg =
            json && typeof json === "object" && "message" in json
              ? String((json as { message: unknown }).message)
              : "공지를 불러오지 못했습니다.";
          setError(msg);
          setItems([]);
          return;
        }
        const parsed = parseAnnouncements(json);
        setItems(parsed ?? []);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("공지를 불러오지 못했습니다.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    const onRead = (event: Event) => {
      const detail = (event as CustomEvent<{ tenant?: string }>).detail;
      if (!detail?.tenant || detail.tenant === tenant) {
        refreshReadState();
      }
    };
    window.addEventListener(MERCHANT_ANNOUNCEMENT_READ_EVENT, onRead);
    return () => window.removeEventListener(MERCHANT_ANNOUNCEMENT_READ_EVENT, onRead);
  }, [tenant, refreshReadState]);

  const readIds = useMemo(() => {
    void readVersion;
    return getReadAnnouncementIds(tenant);
  }, [tenant, readVersion]);

  const urgentItem = useMemo(
    () => items.find((item) => item.type === "urgent") ?? null,
    [items],
  );

  const cardItems = useMemo(
    () => items.filter((item) => item.type !== "urgent"),
    [items],
  );

  const counts = useMemo(() => {
    const byType = (type: AnnouncementType) =>
      items.filter((item) => item.type === type).length;
    return {
      all: items.length,
      urgent: byType("urgent"),
      notice: byType("notice"),
      update: byType("update"),
      event: byType("event"),
    };
  }, [items]);

  const unreadCount = useMemo(
    () => items.filter((item) => !readIds.has(item.id)).length,
    [items, readIds],
  );

  const showUrgentBanner =
    urgentItem != null && (filter === "all" || filter === "urgent");

  const visibleCards = useMemo(() => {
    if (filter === "all") return cardItems;
    if (filter === "urgent") return [];
    return cardItems.filter((item) => item.type === filter);
  }, [cardItems, filter]);

  const openDetail = (item: PlatformAnnouncement) => {
    markAnnouncementRead(tenant, item.id);
    refreshReadState();
    setSelected(item);
  };

  const handleReadAll = () => {
    if (items.length === 0) return;
    markAllAnnouncementsRead(
      tenant,
      items.map((item) => item.id),
    );
    refreshReadState();
    setToast("모든 공지를 읽음 처리했어요");
    window.setTimeout(() => setToast(null), 2800);
  };

  const emptyMessage =
    filter === "all"
      ? "CHAYA 운영팀에서 보낸 안내가 여기에 표시됩니다."
      : `${ANNOUNCEMENT_TYPE_META[filter as AnnouncementType]?.filterLabel ?? "해당"} 항목이 없습니다.`;

  const emptyTitle =
    filter === "all" ? "공지가 없어요" : `${ANNOUNCEMENT_TYPE_META[filter as AnnouncementType]?.filterLabel ?? "해당"} 없음`;

  return (
    <div className={embedded ? "" : "-mt-3"}>
      {!embedded ? (
        <>
          {/* 탑바 */}
          <div
            className={`${chayaAppShellBleedClass} mb-0 flex min-h-[52px] items-center justify-between border-b border-[#E5E7EB] bg-white px-[18px] dark:border-zinc-800 dark:bg-zinc-950`}
          >
            <div className="flex items-center gap-1">
              <Link
                href={`/m/${t}/dashboard`}
                className="inline-flex items-center pr-1 text-[22px] font-bold leading-none text-chaya-primary active:opacity-70"
                aria-label="홈으로 돌아가기"
              >
                <ChevronLeft className="h-6 w-6 shrink-0" strokeWidth={2.5} aria-hidden />
              </Link>
              <span className="text-[17px] font-extrabold text-[#111827] dark:text-zinc-50">
                공지사항
              </span>
              {unreadCount > 0 ? (
                <span className="ml-1 rounded-full bg-[#DC2626] px-2 py-0.5 text-[11px] font-extrabold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleReadAll}
              disabled={items.length === 0 || unreadCount === 0}
              className="text-[13px] font-bold text-[#9CA3AF] transition active:text-chaya-primary disabled:opacity-40"
            >
              전체 읽음
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-end border-b border-[#E5E7EB] bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
          {unreadCount > 0 ? (
            <span className="mr-auto rounded-full bg-[#DC2626] px-2 py-0.5 text-[11px] font-extrabold text-white">
              읽지 않음 {unreadCount}
            </span>
          ) : (
            <span className="mr-auto text-xs text-zinc-400">CHAYA 운영 안내</span>
          )}
          <button
            type="button"
            onClick={handleReadAll}
            disabled={items.length === 0 || unreadCount === 0}
            className="text-[13px] font-bold text-[#9CA3AF] transition active:text-chaya-primary disabled:opacity-40"
          >
            전체 읽음
          </button>
        </div>
      )}

      {/* 필터 탭 — 점주 홈·주문·메뉴 탭과 동일 Lucide·텍스트 톤 */}
      <div
        className={`${chayaAppShellBleedClass} border-b border-[#E5E7EB] bg-white dark:border-zinc-800 dark:bg-zinc-950`}
      >
        <nav className={merchantTabRowClass} aria-label="공지 유형">
        {FILTER_ORDER.map((key) => {
          const active = filter === key;
          const count = counts[key];
          const label =
            key === "all" ? "전체" : ANNOUNCEMENT_TYPE_META[key].filterLabel;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={merchantTabLinkClass(active)}
            >
              {label}
              <span className={merchantTabCountBadgeClass({ isActive: active })}>
                {count}
              </span>
            </button>
          );
        })}
        </nav>
      </div>

      {/* 목록 */}
      <div className="flex flex-col gap-2 px-0 pb-24 pt-2.5">
        {loading ? (
          <MerchantLoadingCenter context="announcements" />
        ) : error ? (
          <p
            role="alert"
            className="mx-1 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          >
            {error}
          </p>
        ) : items.length === 0 ? (
          <MerchantEmptyState icon={Bell} title={emptyTitle} description={emptyMessage} />
        ) : (
          <>
            {showUrgentBanner && urgentItem ? (
              <button
                type="button"
                onClick={() => openDetail(urgentItem)}
                className="mx-0 flex items-start gap-2.5 rounded-[14px] border-[1.5px] border-red-500/25 bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] px-4 py-3.5 text-left active:opacity-80 dark:from-red-950/40 dark:to-red-950/20"
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                  aria-hidden
                >
                  <AlertTriangle className="size-5" strokeWidth={2.25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[11px] font-extrabold tracking-wide text-[#DC2626]">
                    긴급 공지
                  </span>
                  <span className="block text-sm font-extrabold leading-snug text-[#111827] dark:text-zinc-50">
                    {urgentItem.title}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium leading-relaxed text-[#4B5563] dark:text-zinc-400">
                    {urgentItem.preview}
                  </span>
                </span>
                <span className="shrink-0 self-center text-lg text-[#DC2626]" aria-hidden>
                  ›
                </span>
              </button>
            ) : null}

            {visibleCards.length === 0 && !showUrgentBanner ? (
              <MerchantEmptyState icon={Bell} title={emptyTitle} description={emptyMessage} />
            ) : (
              visibleCards.map((item) => {
                const unread = !readIds.has(item.id);
                const meta = ANNOUNCEMENT_TYPE_META[item.type];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openDetail(item)}
                    className={`relative overflow-hidden rounded-[14px] border bg-white text-left transition active:bg-[#F2F3F5] dark:bg-zinc-950 ${
                      unread
                        ? "border-[#E5E7EB] shadow-[0_1px_6px_rgba(0,0,0,0.06)] dark:border-zinc-800"
                        : "border-[#E5E7EB] opacity-65 dark:border-zinc-800"
                    }`}
                  >
                    {unread ? (
                      <span
                        className={`absolute bottom-0 left-0 top-0 w-[3px] rounded-l-[2px] ${
                          item.type === "urgent" ? "bg-[#DC2626]" : "bg-[#2563EB]"
                        }`}
                        aria-hidden
                      />
                    ) : null}
                    <div className="px-4 py-3.5 pl-[19px]">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${meta.badgeClass}`}
                        >
                          {meta.badge}
                        </span>
                        <span className="ml-auto shrink-0 text-[11px] font-semibold text-[#9CA3AF]">
                          {formatAnnouncementDateLabel(item.createdAt)}
                        </span>
                        {unread ? (
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              item.type === "urgent" ? "bg-[#DC2626]" : "bg-[#2563EB]"
                            }`}
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <p
                        className={`mb-1 line-clamp-2 text-[15px] leading-snug text-[#111827] dark:text-zinc-50 ${
                          unread ? "font-extrabold" : "font-semibold"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="line-clamp-2 text-[13px] font-medium leading-relaxed text-[#9CA3AF]">
                        {item.preview}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </>
        )}
      </div>

      <MerchantAnnouncementDetailSheet
        open={selected != null}
        item={selected}
        onClose={() => setSelected(null)}
      />

      {toast ? (
        <div
          role="status"
          className={`fixed left-4 right-4 z-[90] rounded-xl bg-[rgba(17,24,39,0.9)] px-4 py-3.5 text-sm font-semibold text-white shadow-lg ${
            embedded ? "bottom-6" : "bottom-[78px]"
          }`}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
