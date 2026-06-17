import type { ChayaMenuRow } from "@/lib/menus/types";

/** 신규 스티커 — 등록 후 이 일수 이내 */
export const MENU_NEW_ITEM_DAYS = 14;

export type MenuItemBadgeKind = "featured" | "popular" | "new";

export type MenuItemBadge = {
  kind: MenuItemBadgeKind;
  label: string;
};

export type MenuBadgeLabels = {
  featured: string;
  popular: string;
  new: string;
};

export function parseMenuCreatedAt(raw: Record<string, unknown>): string | null {
  const v = raw.created_at ?? raw.createdAt;
  if (typeof v === "string" && v.trim()) {
    const t = Date.parse(v);
    return Number.isFinite(t) ? v : null;
  }
  return null;
}

export function isMenuItemNew(createdAt: string | null, nowMs = Date.now()): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return false;
  return nowMs - t <= MENU_NEW_ITEM_DAYS * 24 * 60 * 60 * 1000;
}

/** 카드 스티커 — 대표·인기는 동시에 1개만, 신규는 함께 가능(최대 2개) */
export function resolveMenuItemBadges(
  item: ChayaMenuRow,
  popularMenuIds: readonly string[],
  labels: MenuBadgeLabels,
): MenuItemBadge[] {
  const topPopularId = popularMenuIds[0]?.trim() ?? null;
  const out: MenuItemBadge[] = [];

  if (item.isStoreRecommended) {
    out.push({ kind: "featured", label: labels.featured });
  } else if (topPopularId && item.id === topPopularId) {
    out.push({ kind: "popular", label: labels.popular });
  }

  if (isMenuItemNew(item.createdAt) && out.length < 2) {
    out.push({ kind: "new", label: labels.new });
  }

  return out;
}
