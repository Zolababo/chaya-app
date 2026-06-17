import "server-only";

import { cache } from "react";

import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetryResult } from "@/lib/supabase/transient-retry";

/** 라이브 폴링·뱃지용 — pending count 1회만 */
export const getMerchantPendingCountQuick = cache(async function getMerchantPendingCountQuick(
  tenantSlug: string,
): Promise<number | null> {
  const slug = tenantSlug.trim();
  if (!slug) return null;

  const client = createServiceSupabase();
  if (!client) return null;

  const { error, count } = await withSupabaseReadRetryResult(() =>
    client
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("tenant_slug", slug)
      .eq("status", "pending"),
  );

  if (error) return null;
  return count ?? 0;
});
