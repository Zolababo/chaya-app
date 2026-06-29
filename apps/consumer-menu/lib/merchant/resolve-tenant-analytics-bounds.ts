import "server-only";

import { cache } from "react";

import { fetchTenantStoreSettings } from "@/lib/tenant/tenant-store-settings";
import {
  getCurrentBusinessDayBounds,
  getLastBusinessDaysWindow,
  getPreviousBusinessDayBounds,
  getSalesDayCutoff,
  businessDayBoundsForRangeKeys,
  businessDayBoundsForKey,
  addKstDateKey,
  type BusinessDayBounds,
} from "@/lib/tenant/merchant-business-day";
import type { MerchantAnalyticsRequest } from "@/lib/orders/merchant-analytics";

export type TenantAnalyticsTimeBounds =
  | ({
      ok: true;
      sinceIso: string;
      untilIso: string;
      periodLabel: string;
      cutoff: string;
      rangeLabel: string;
      businessDayKey: string;
    } & BusinessDayBounds)
  | { ok: false; message: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const resolveTenantAnalyticsTimeBounds = cache(async function resolveTenantAnalyticsTimeBounds(
  tenantSlug: string,
  req: MerchantAnalyticsRequest,
): Promise<TenantAnalyticsTimeBounds> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "테넌트가 없습니다." };

  const settings = await fetchTenantStoreSettings(slug);
  const cutoff = getSalesDayCutoff(settings);

  if (req.kind === "range") {
    if (!DATE_RE.test(req.from) || !DATE_RE.test(req.to) || req.from > req.to) {
      return { ok: false, message: "기간 설정이 올바르지 않습니다." };
    }
    const bounds = businessDayBoundsForRangeKeys(req.from, req.to, cutoff);
    return {
      ok: true,
      ...bounds,
      cutoff,
      periodLabel: `${req.from.slice(5)} ~ ${req.to.slice(5)} (영업일)`,
    };
  }

  if (req.kind === "month") {
    const current = getCurrentBusinessDayBounds(cutoff);
    const [y, mo] = current.businessDayKey.split("-").map(Number) as [number, number];
    const monthStartKey = `${y}-${String(mo).padStart(2, "0")}-01`;
    const bounds = businessDayBoundsForRangeKeys(monthStartKey, current.businessDayKey, cutoff);
    return {
      ok: true,
      ...bounds,
      cutoff,
      periodLabel: "이번 달 (영업일)",
    };
  }

  const window = getLastBusinessDaysWindow(req.days, cutoff);
  const periodLabel =
    req.days === 1
      ? "이번 영업일"
      : req.days === 7
        ? "최근 7영업일"
        : req.days === 30
          ? "최근 30영업일"
          : `최근 ${req.days}영업일`;

  return {
    ok: true,
    businessDayKey: window.businessDayKey,
    sinceIso: window.sinceIso,
    untilIso: window.untilIso,
    dateLabel: window.dateLabel,
    rangeLabel: window.rangeLabel,
    cutoff,
    periodLabel,
  };
});

export async function getTenantCurrentBusinessDayBounds(
  tenantSlug: string,
  nowMs = Date.now(),
): Promise<BusinessDayBounds & { cutoff: string }> {
  const settings = await fetchTenantStoreSettings(tenantSlug);
  const cutoff = getSalesDayCutoff(settings);
  return { ...getCurrentBusinessDayBounds(cutoff, nowMs), cutoff };
}

export async function getTenantPreviousBusinessDayBounds(
  tenantSlug: string,
  nowMs = Date.now(),
): Promise<BusinessDayBounds & { cutoff: string }> {
  const settings = await fetchTenantStoreSettings(tenantSlug);
  const cutoff = getSalesDayCutoff(settings);
  return { ...getPreviousBusinessDayBounds(cutoff, nowMs), cutoff };
}

/** 지난달 — 영업일 키 범위 (달력 월 1일 ~ 해당 월 말 영업일) */
export function businessDayBoundsForPreviousCalendarMonth(
  cutoff: string,
  nowMs = Date.now(),
): BusinessDayBounds {
  const currentKey = getCurrentBusinessDayBounds(cutoff, nowMs).businessDayKey;
  const [y, mo] = currentKey.split("-").map(Number) as [number, number];
  const prevMo = mo === 1 ? 12 : mo - 1;
  const prevY = mo === 1 ? y - 1 : y;
  const lastDay = new Date(prevY, prevMo, 0).getDate();
  const mm = String(prevMo).padStart(2, "0");
  const fromKey = `${prevY}-${mm}-01`;
  const toKey = `${prevY}-${mm}-${String(lastDay).padStart(2, "0")}`;
  return businessDayBoundsForRangeKeys(fromKey, toKey, cutoff);
}

export function businessDayBoundsForLastMonthParam(cutoff: string, nowMs = Date.now()): BusinessDayBounds {
  return businessDayBoundsForPreviousCalendarMonth(cutoff, nowMs);
}

export function monthEndBusinessDayKey(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export { addKstDateKey, businessDayBoundsForKey };
