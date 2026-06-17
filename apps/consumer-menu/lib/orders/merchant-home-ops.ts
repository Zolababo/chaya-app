import "server-only";

import { cache } from "react";

import { getKstCalendarDayBounds } from "@/lib/orders/merchant-analytics";
import { MERCHANT_COOKING_STATUSES } from "@/lib/orders/merchant-status-constants";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";
import { withSupabaseReadRetryResult } from "@/lib/supabase/transient-retry";

export type MerchantDelayedOrder = {
  id: string;
  tableNo: string | null;
};

export type MerchantHomeOpsCounts =
  | {
      ok: true;
      pending: number;
      cooking: number;
      ready: number;
      todayPaid: number;
      todayCancelled: number;
      /** 10분 이상 조리 중인 주문 수 (지연 감지) */
      delayedCount: number;
      /** 지연 주문 목록 (테이블 번호 포함, 최대 10건) */
      delayedOrders: MerchantDelayedOrder[];
    }
  | { ok: false; message: string };

/** 점주 홈 「운영」 5단계 — 큐 3종(전체) + 당일 결제·취소(KST). 요청당 1회. */
export const getMerchantHomeOpsCounts = cache(async function getMerchantHomeOpsCounts(
  tenantSlug: string,
): Promise<MerchantHomeOpsCounts> {
  const slug = tenantSlug.trim();
  if (!slug) return { ok: false, message: "테넌트가 없습니다." };

  const client = createServiceSupabase();
  if (!client) {
    return {
      ok: false,
      message:
        "Supabase 서버 설정이 없습니다. SUPABASE_SERVICE_ROLE_KEY와 URL을 확인한 뒤 다시 시도해 주세요.",
    };
  }

  const { sinceIso, untilIso } = getKstCalendarDayBounds();
  // 10분 전 기준: 이보다 먼저 접수된 조리중 주문 = 지연
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const [pendingRes, cookingRes, readyRes, todayRes, delayedRes] = await Promise.all([
    withSupabaseReadRetryResult(() =>
      client
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_slug", slug)
        .eq("status", "pending"),
    ),
    withSupabaseReadRetryResult(() =>
      client
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_slug", slug)
        .in("status", [...MERCHANT_COOKING_STATUSES]),
    ),
    withSupabaseReadRetryResult(() =>
      client
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_slug", slug)
        .eq("status", "ready"),
    ),
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("status")
        .eq("tenant_slug", slug)
        .gte("created_at", sinceIso)
        .lt("created_at", untilIso)
        .in("status", ["completed", "cancelled"]),
    ),
    // 10분 초과 조리중 주문 — 테이블 번호 포함해서 조회
    withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("id, table_no")
        .eq("tenant_slug", slug)
        .lt("created_at", tenMinutesAgo)
        .in("status", [...MERCHANT_COOKING_STATUSES])
        .order("created_at", { ascending: true })
        .limit(10),
    ),
  ]);

  if (pendingRes.error || cookingRes.error || readyRes.error) {
    return {
      ok: false,
      message:
        pendingRes.error?.message ??
        cookingRes.error?.message ??
        readyRes.error?.message ??
        "운영 숫자를 불러오지 못했습니다.",
    };
  }

  if (todayRes.error) {
    return { ok: false, message: todayRes.error.message ?? "오늘 결제·취소를 불러오지 못했습니다." };
  }

  let todayPaid = 0;
  let todayCancelled = 0;
  for (const row of todayRes.data ?? []) {
    const st = typeof row.status === "string" ? row.status : "";
    if (st === "completed") todayPaid += 1;
    else if (st === "cancelled") todayCancelled += 1;
  }

  const delayedOrders: MerchantDelayedOrder[] = delayedRes.error
    ? []
    : (delayedRes.data ?? []).map((r) => ({
        id: String((r as Record<string, unknown>).id ?? ""),
        tableNo:
          typeof (r as Record<string, unknown>).table_no === "string"
            ? ((r as Record<string, unknown>).table_no as string)
            : null,
      }));

  return {
    ok: true,
    pending: pendingRes.count ?? 0,
    cooking: cookingRes.count ?? 0,
    ready: readyRes.count ?? 0,
    todayPaid,
    todayCancelled,
    delayedCount: delayedOrders.length,
    delayedOrders,
  };
});
