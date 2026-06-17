"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  countUnreadAnnouncements,
  hasUnreadUrgent,
  MERCHANT_ANNOUNCEMENT_READ_EVENT,
} from "@/lib/merchant/merchant-announcement-read";
import {
  merchantCacheKey,
  readMerchantCache,
  writeMerchantCache,
} from "@/lib/merchant/merchant-client-cache";
import type { PlatformAnnouncement } from "@/lib/merchant/platform-announcement";

type AnnouncementsPayload = { ok: true; items: PlatformAnnouncement[] };

type Props = {
  tenant: string;
};

function parseAnnouncements(json: unknown): AnnouncementsPayload | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (o.ok !== true || !Array.isArray(o.items)) return null;
  return { ok: true, items: o.items as PlatformAnnouncement[] };
}

export function MerchantHeaderBell({ tenant }: Props) {
  const t = encodeURIComponent(tenant);
  const cacheKey = merchantCacheKey(tenant, "announcements");
  const [items, setItems] = useState<PlatformAnnouncement[]>(() => {
    const cached = readMerchantCache<AnnouncementsPayload>(cacheKey);
    return cached?.items ?? [];
  });
  const [readVersion, setReadVersion] = useState(0);

  const refreshReadState = useCallback(() => {
    setReadVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/m/${t}/live/announcements`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as unknown;
        const parsed = parseAnnouncements(json);
        if (!parsed || cancelled) return;
        setItems(parsed.items);
        writeMerchantCache(cacheKey, parsed);
      } catch {
        // ignore
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [t, cacheKey]);

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

  const { unreadCount, urgentUnread } = useMemo(() => {
    void readVersion;
    const ids = items.map((item) => item.id);
    return {
      unreadCount: countUnreadAnnouncements(tenant, ids),
      urgentUnread: hasUnreadUrgent(tenant, items),
    };
  }, [items, tenant, readVersion]);

  const showDot = unreadCount > 0;

  return (
    <Link
      href={`/m/${t}/notifications`}
      className="relative inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#F2F3F5] text-zinc-700 active:opacity-75 dark:bg-zinc-900 dark:text-zinc-200"
      aria-label={showDot ? `공지사항, 읽지 않음 ${unreadCount}건` : "공지사항"}
    >
      <Bell className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      {showDot ? (
        <span
          className={`absolute right-[5px] top-[5px] h-[9px] w-[9px] rounded-full border-2 border-white dark:border-zinc-950 ${
            urgentUnread
              ? "animate-[merchant-bell-urgent_0.8s_ease_infinite] bg-[#DC2626]"
              : "animate-[merchant-bell-pulse_1.6s_ease_infinite] bg-[#DC2626]"
          }`}
          aria-hidden
        />
      ) : null}
    </Link>
  );
}
