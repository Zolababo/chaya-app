import "server-only";

import { consumePendingReAlertPushCooldown } from "@/lib/notifications/merchant-pending-push-cooldown";
import {
  loadPushSubscriptionsForApprovedMembers,
  sendGuestOrderWebPush,
} from "@/lib/notifications/merchant-push-send";
import { getServerSiteBaseUrl } from "@/lib/notifications/site-base-url";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

export type PendingPushCronResult = {
  tenantsChecked: number;
  pushesSent: number;
  skippedCooldown: number;
  skippedNoSubs: number;
};

/** pending 주문이 남은 매장에 Web Push 재알림 (앱 백그라운드·화면 OFF용) */
export async function runMerchantPendingReAlertPushCron(): Promise<PendingPushCronResult> {
  const svc = createServiceSupabase();
  const result: PendingPushCronResult = {
    tenantsChecked: 0,
    pushesSent: 0,
    skippedCooldown: 0,
    skippedNoSubs: 0,
  };

  if (!svc) return result;

  const { data, error } = await svc.from("orders").select("tenant_slug").eq("status", "pending");

  if (error || !data?.length) return result;

  const pendingByTenant = new Map<string, number>();
  for (const row of data) {
    const slug = typeof (row as { tenant_slug?: unknown }).tenant_slug === "string"
      ? (row as { tenant_slug: string }).tenant_slug.trim()
      : "";
    if (!slug) continue;
    pendingByTenant.set(slug, (pendingByTenant.get(slug) ?? 0) + 1);
  }

  const base = getServerSiteBaseUrl();

  for (const [tenantSlug, pendingCount] of pendingByTenant) {
    result.tenantsChecked += 1;
    if (pendingCount <= 0) continue;
    if (!consumePendingReAlertPushCooldown(tenantSlug)) {
      result.skippedCooldown += 1;
      continue;
    }

    const subs = await loadPushSubscriptionsForApprovedMembers(svc, tenantSlug);
    if (subs.length === 0) {
      result.skippedNoSubs += 1;
      continue;
    }

    const path = `/m/${encodeURIComponent(tenantSlug)}/orders`;
    const ordersLink = base ? `${base}${path}` : path;
    const label = pendingCount === 1 ? "대기 주문 1건" : `대기 주문 ${pendingCount}건`;

    await sendGuestOrderWebPush({
      svc,
      tenantSlug,
      orderId: "pending-realert",
      title: `[CHAYA] ${tenantSlug}`,
      body: `${label} · 아직 처리되지 않았습니다. 탭하여 주문 큐`,
      openUrl: ordersLink,
      subscriptions: subs,
      tag: "chaya-pending-realert",
    });

    result.pushesSent += 1;
  }

  return result;
}
