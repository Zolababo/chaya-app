import type { SupabaseClient } from "@supabase/supabase-js";

import { ensureWebPushVapidConfigured } from "./merchant-push-config";

export type MerchantPushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
};

export async function loadPushSubscriptionsForApprovedMembers(
  svc: SupabaseClient,
  tenantSlug: string,
): Promise<MerchantPushSubscriptionRow[]> {
  const tenant = tenantSlug.trim();
  if (!tenant) return [];

  const { data: members, error: memErr } = await svc
    .from("merchant_tenant_members")
    .select("user_id")
    .eq("tenant_slug", tenant)
    .not("approved_at", "is", null);

  if (memErr || !members?.length) return [];

  const allowed = new Set<string>();
  for (const m of members) {
    const id = (m as { user_id?: unknown }).user_id;
    if (typeof id === "string") allowed.add(id);
  }
  if (allowed.size === 0) return [];

  const { data: subs, error: subErr } = await svc
    .from("merchant_push_subscriptions")
    .select("endpoint,p256dh,auth,user_id")
    .eq("tenant_slug", tenant);

  if (subErr || !subs) return [];

  const out: MerchantPushSubscriptionRow[] = [];
  for (const raw of subs) {
    const row = raw as { endpoint?: unknown; p256dh?: unknown; auth?: unknown; user_id?: unknown };
    const endpoint = typeof row.endpoint === "string" ? row.endpoint : "";
    const p256dh = typeof row.p256dh === "string" ? row.p256dh : "";
    const auth = typeof row.auth === "string" ? row.auth : "";
    const user_id = typeof row.user_id === "string" ? row.user_id : "";
    if (!endpoint || !p256dh || !auth || !user_id) continue;
    if (!allowed.has(user_id)) continue;
    out.push({ endpoint, p256dh, auth, user_id });
  }
  return out;
}

/**
 * Sends one push per subscription; removes expired subscriptions (410/404).
 */
export async function sendGuestOrderWebPush(input: {
  svc: SupabaseClient;
  tenantSlug: string;
  orderId: string;
  title: string;
  body: string;
  openUrl: string;
  subscriptions: MerchantPushSubscriptionRow[];
}): Promise<void> {
  if (input.subscriptions.length === 0) return;
  const ok = await ensureWebPushVapidConfigured();
  if (!ok) return;

  const webpush = (await import("web-push")).default;

  for (const sub of input.subscriptions) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    const payload = JSON.stringify({
      title: input.title,
      body: input.body,
      data: { url: input.openUrl },
    });

    try {
      await webpush.sendNotification(pushSub, payload, {
        TTL: 60 * 60,
        urgency: "high",
      });
    } catch (e: unknown) {
      const status = typeof e === "object" && e && "statusCode" in e ? (e as { statusCode?: number }).statusCode : undefined;
      if (status === 410 || status === 404) {
        await input.svc.from("merchant_push_subscriptions").delete().eq("endpoint", sub.endpoint);
      } else {
        console.error("[sendGuestOrderWebPush]", status ?? "", e instanceof Error ? e.message : e);
      }
    }
  }
}
