"use server";

import { revalidatePath } from "next/cache";

import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

const MAX_EP = 2048;
const MAX_KEY = 200;

export type PushActionResult = { ok: true } | { ok: false; code: string };

export async function saveMerchantPushSubscription(
  tenantRaw: string,
  payload: { endpoint: string; p256dh: string; auth: string },
): Promise<PushActionResult> {
  const tenant = tenantRaw.trim();
  await requireMerchantForTenant(tenant);

  const endpoint = payload.endpoint.trim();
  const p256dh = payload.p256dh.trim();
  const auth = payload.auth.trim();

  if (endpoint.length < 8 || endpoint.length > MAX_EP) {
    return { ok: false, code: "push_bad_endpoint" };
  }
  if (!p256dh || p256dh.length > MAX_KEY || !auth || auth.length > MAX_KEY) {
    return { ok: false, code: "push_bad_keys" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, code: "push_no_session" };

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (userErr || !uid) return { ok: false, code: "push_no_session" };

  const { error } = await supabase.from("merchant_push_subscriptions").upsert(
    {
      user_id: uid,
      tenant_slug: tenant,
      endpoint,
      p256dh,
      auth,
    },
    { onConflict: "user_id,tenant_slug,endpoint" },
  );

  if (error) {
    console.error("[saveMerchantPushSubscription]", error.message);
    return { ok: false, code: "push_save_failed" };
  }

  revalidatePath(`/m/${encodeURIComponent(tenant)}/dashboard`);
  return { ok: true };
}

export async function removeMerchantPushSubscription(
  tenantRaw: string,
  payload: { endpoint: string },
): Promise<PushActionResult> {
  const tenant = tenantRaw.trim();
  await requireMerchantForTenant(tenant);

  const endpoint = payload.endpoint.trim();
  if (endpoint.length < 8 || endpoint.length > MAX_EP) {
    return { ok: false, code: "push_bad_endpoint" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, code: "push_no_session" };

  const { error } = await supabase.from("merchant_push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) {
    console.error("[removeMerchantPushSubscription]", error.message);
    return { ok: false, code: "push_remove_failed" };
  }

  revalidatePath(`/m/${encodeURIComponent(tenant)}/dashboard`);
  return { ok: true };
}
