import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

/** 이번 QR 스캔 이후 결제완료가 있으면 방문 종료 — 재주문은 QR 재스캔 필요. */
export async function guestVisitClosedAfterGateScan(
  client: SupabaseClient,
  tenantSlug: string,
  guestSessionId: string,
  gateScanIatSec: number,
): Promise<boolean> {
  const slug = tenantSlug.trim();
  const sid = guestSessionId.trim();
  if (!slug || !sid || gateScanIatSec <= 0) return false;

  const sinceIso = new Date(gateScanIatSec * 1000).toISOString();

  const first = await withSupabaseReadRetry(() =>
    client
      .from("orders")
      .select("id")
      .eq("tenant_slug", slug)
      .eq("guest_session_id", sid)
      .eq("status", "completed")
      .gte("completed_at", sinceIso)
      .limit(1),
  );

  if (!first.error && (first.data?.length ?? 0) > 0) return true;

  if (first.error && /completed_at|does not exist/i.test(first.error.message ?? "")) {
    const legacy = await withSupabaseReadRetry(() =>
      client
        .from("orders")
        .select("id")
        .eq("tenant_slug", slug)
        .eq("guest_session_id", sid)
        .eq("status", "completed")
        .gte("created_at", sinceIso)
        .limit(1),
    );
    return (legacy.data?.length ?? 0) > 0;
  }

  return false;
}
