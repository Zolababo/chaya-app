import type { ListMerchantOrdersQuery } from "@/lib/orders/list-orders-for-merchant";

export const MERCHANT_ORDERS_TABS = [
  "all",
  "pending",
  "cooking",
  "ready",
  "paid",
  "cancelled",
] as const;

export type MerchantOrdersTab = (typeof MERCHANT_ORDERS_TABS)[number];

const TAB_LABEL: Record<MerchantOrdersTab, string> = {
  all: "전체",
  pending: "주문",
  cooking: "조리중",
  ready: "서빙완료",
  paid: "결제완료",
  cancelled: "취소",
};

export function merchantOrdersTabLabel(tab: MerchantOrdersTab): string {
  return TAB_LABEL[tab];
}

export function isMerchantOrdersTab(v: string): v is MerchantOrdersTab {
  return (MERCHANT_ORDERS_TABS as readonly string[]).includes(v);
}

export function merchantOrdersTabHref(
  tenant: string,
  tab: MerchantOrdersTab,
  orderId?: string | null,
): string {
  const q = new URLSearchParams({ tab });
  if (orderId?.trim()) q.set("order", orderId.trim());
  return `/m/${encodeURIComponent(tenant)}/orders?${q.toString()}`;
}

export function tabToListQuery(tab: MerchantOrdersTab): ListMerchantOrdersQuery {
  switch (tab) {
    case "all":
      return { bucket: "all_active" };
    case "pending":
      return { status: "pending" };
    case "cooking":
      return { bucket: "cooking" };
    case "ready":
      return { status: "ready" };
    case "paid":
      return { status: "completed", todayKst: true };
    case "cancelled":
      return { status: "cancelled", todayKst: true };
  }
}

/** 기본 탭 — 항상 전체 */
export function defaultMerchantOrdersTab(_pendingCount: number | null): MerchantOrdersTab {
  return "all";
}

/** 구 URL → tab. `in_progress`·`completed` 등 호환. */
export function legacyParamsToTab(
  status: string | undefined,
  bucket: string | undefined,
  today: string | undefined,
): MerchantOrdersTab | null {
  const b = bucket?.trim();
  if (b === "cooking") return "cooking";
  if (b === "in_progress") return "cooking";
  const s = status?.trim();
  if (s === "pending") return "pending";
  if (s === "ready") return "ready";
  if (s === "accepted" || s === "preparing") return "cooking";
  if (s === "completed" && (today === "1" || today === "true")) return "paid";
  if (s === "cancelled" && (today === "1" || today === "true")) return "cancelled";
  if (s === "completed") return "paid";
  if (s === "cancelled") return "cancelled";
  return null;
}

/** 구 4탭 URL → 5탭. */
export function migrateLegacyTabId(tab: string): MerchantOrdersTab | null {
  const t = tab.trim();
  if (isMerchantOrdersTab(t)) return t;
  if (t === "in_progress") return "cooking";
  if (t === "completed") return "paid";
  return null;
}

export function resolveMerchantOrdersTab(
  tabParam: string | undefined,
  legacy: { status?: string; bucket?: string; today?: string },
  pendingCount: number | null,
): MerchantOrdersTab {
  const raw = typeof tabParam === "string" ? tabParam.trim() : "";
  const migrated = raw ? migrateLegacyTabId(raw) : null;
  if (migrated) return migrated;
  const fromLegacy = legacyParamsToTab(legacy.status, legacy.bucket, legacy.today);
  if (fromLegacy) return fromLegacy;
  return defaultMerchantOrdersTab(pendingCount);
}

/** Next.js searchParams — `string | string[]` 안전 추출 */
export function firstMerchantSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** 서버 주문 페이지 redirect·탭 결정 (pending 없이) */
export function resolveOrdersTabFromSearchParams(
  tabParam: string | string[] | undefined,
  legacy: {
    status?: string | string[];
    bucket?: string | string[];
    today?: string | string[];
  },
): MerchantOrdersTab {
  return resolveMerchantOrdersTab(
    firstMerchantSearchParam(tabParam),
    {
      status: firstMerchantSearchParam(legacy.status),
      bucket: firstMerchantSearchParam(legacy.bucket),
      today: firstMerchantSearchParam(legacy.today),
    },
    null,
  );
}
