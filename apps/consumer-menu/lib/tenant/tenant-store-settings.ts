import "server-only";

import { cache } from "react";

import { parseTenantBillingPlan, type TenantBillingPlan } from "@/lib/tenant/tenant-billing-plan";
import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

const KST = "Asia/Seoul";

export type TenantStoreSettings = {
  tenantSlug: string;
  displayName: string | null;
  logoUrl: string | null;
  intro: string | null;
  ordersAccepting: boolean;
  breakStart: string | null;
  breakEnd: string | null;
  /** KST HH:MM — 영업 시작 (안내) */
  businessOpen: string | null;
  /** KST HH:MM — 영업 마감 (안내, 자정 넘김 가능) */
  businessClose: string | null;
  /** KST HH:MM — 매출·손님 영업일 구분 (기본 04:00) */
  salesDayCutoff: string;
  kakaoAlimtalkLinkedAt: string | null;
  billingPlan: TenantBillingPlan;
};

function parseRow(tenantSlug: string, row: Record<string, unknown> | null): TenantStoreSettings {
  if (!row) {
    return {
      tenantSlug,
      displayName: null,
      logoUrl: null,
      intro: null,
      ordersAccepting: true,
      breakStart: null,
      breakEnd: null,
      businessOpen: null,
      businessClose: null,
      salesDayCutoff: "04:00",
      kakaoAlimtalkLinkedAt: null,
      billingPlan: "starter",
    };
  }
  return {
    tenantSlug,
    displayName: typeof row.display_name === "string" ? row.display_name.trim() || null : null,
    logoUrl: typeof row.logo_url === "string" ? row.logo_url.trim() || null : null,
    intro: typeof row.intro === "string" ? row.intro.trim() || null : null,
    ordersAccepting: row.orders_accepting !== false,
    breakStart: typeof row.break_start === "string" ? row.break_start : null,
    breakEnd: typeof row.break_end === "string" ? row.break_end : null,
    businessOpen: typeof row.business_open === "string" ? row.business_open : null,
    businessClose: typeof row.business_close === "string" ? row.business_close : null,
    salesDayCutoff:
      typeof row.sales_day_cutoff === "string" && row.sales_day_cutoff.trim()
        ? row.sales_day_cutoff.trim()
        : "04:00",
    kakaoAlimtalkLinkedAt:
      typeof row.kakao_alimtalk_linked_at === "string" ? row.kakao_alimtalk_linked_at : null,
    billingPlan: parseTenantBillingPlan(row.billing_plan),
  };
}

export function isKakaoAlimtalkLinked(settings: TenantStoreSettings): boolean {
  return settings.kakaoAlimtalkLinkedAt != null && settings.kakaoAlimtalkLinkedAt.length > 0;
}

export const fetchTenantStoreSettings = cache(async function fetchTenantStoreSettings(
  tenantSlug: string,
): Promise<TenantStoreSettings> {
  const tenant = tenantSlug.trim();
  if (!tenant) {
    return parseRow("", null);
  }

  const client = createServiceSupabase() ?? createConsumerSupabase();
  if (!client) {
    return parseRow(tenant, null);
  }

  const { data, error } = await withSupabaseReadRetry(() =>
    client.from("tenant_store_settings").select("*").eq("tenant_slug", tenant).maybeSingle(),
  );

  if (error) {
    if (error.code === "42P01" || (error.message ?? "").includes("tenant_store_settings")) {
      return parseRow(tenant, null);
    }
    console.error("[fetchTenantStoreSettings]", error.code ?? "", error.message);
    return parseRow(tenant, null);
  }

  return parseRow(tenant, (data as Record<string, unknown> | null) ?? null);
});

function kstMinutesNow(nowMs = Date.now()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(nowMs);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function parseHm(raw: string | null): number | null {
  if (!raw) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** 브레이크타임 구간이면 true (자정 넘김 미지원 — 당일 구간만). */
export function isWithinStoreBreakTime(settings: TenantStoreSettings, nowMs = Date.now()): boolean {
  const start = parseHm(settings.breakStart);
  const end = parseHm(settings.breakEnd);
  if (start == null || end == null || start === end) return false;
  const now = kstMinutesNow(nowMs);
  if (start < end) {
    return now >= start && now < end;
  }
  return now >= start || now < end;
}

export function canAcceptGuestOrdersNow(settings: TenantStoreSettings, nowMs = Date.now()): boolean {
  if (!settings.ordersAccepting) return false;
  if (isWithinStoreBreakTime(settings, nowMs)) return false;
  return true;
}
