"use client";

import type { AnnouncementType } from "@/lib/merchant/platform-announcement";

const STORAGE_PREFIX = "chaya_merchant_notice_read_v1:";

export const MERCHANT_ANNOUNCEMENT_READ_EVENT = "chaya:merchant-announcement-read";

function storageKey(tenant: string): string {
  return `${STORAGE_PREFIX}${tenant.trim()}`;
}

function readRaw(tenant: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(tenant));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function writeRaw(tenant: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(tenant), JSON.stringify([...new Set(ids)]));
    window.dispatchEvent(
      new CustomEvent(MERCHANT_ANNOUNCEMENT_READ_EVENT, { detail: { tenant } }),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function getReadAnnouncementIds(tenant: string): Set<string> {
  return new Set(readRaw(tenant));
}

export function markAnnouncementRead(tenant: string, id: string): void {
  const next = readRaw(tenant);
  if (next.includes(id)) return;
  next.push(id);
  writeRaw(tenant, next);
}

export function markAllAnnouncementsRead(tenant: string, ids: string[]): void {
  writeRaw(tenant, [...readRaw(tenant), ...ids]);
}

export function countUnreadAnnouncements(
  tenant: string,
  announcementIds: string[],
): number {
  const read = getReadAnnouncementIds(tenant);
  return announcementIds.filter((id) => !read.has(id)).length;
}

export function hasUnreadUrgent(
  tenant: string,
  items: { id: string; type: AnnouncementType }[],
): boolean {
  const read = getReadAnnouncementIds(tenant);
  return items.some((item) => item.type === "urgent" && !read.has(item.id));
}
