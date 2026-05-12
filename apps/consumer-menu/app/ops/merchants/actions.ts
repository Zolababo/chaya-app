"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { merchantLoginUsesSms } from "@/lib/merchant/merchant-login-mode";
import { normalizeKrPhoneToE164 } from "@/lib/merchant/phone-e164-kr";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { normalizeTenantSlug } from "@/lib/tenant/tenant-slug";

const UUID_ROW = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function backToMerchants(opts: Record<string, string>): never {
  const q = new URLSearchParams(opts);
  redirect(`/ops/merchants?${q.toString()}`);
}

/** SMS 모드에서는 Phone 전용 초대 행만, 기본 이메일 모드에서는 email + invite_email 만 채움 */
export async function inviteMerchantFromOps(formData: FormData): Promise<void> {
  await requirePlatformOperator("/ops/merchants");

  const useSms = merchantLoginUsesSms();
  const tenantRaw = String(formData.get("tenant_slug") ?? "").trim();
  const tenant_slug = normalizeTenantSlug(tenantRaw);
  if (!tenant_slug) {
    backToMerchants({ e: "bad_tenant_slug" });
  }
  const roleRaw = String(formData.get("role") ?? "owner").trim();
  const role = roleRaw === "staff" ? "staff" : "owner";

  const service = createServiceSupabase();
  if (!service) {
    backToMerchants({ e: "no_service" });
  }

  let userId = "";
  const insertExtras: Record<string, string | null> = {};

  if (useSms) {
    const phone = normalizeKrPhoneToE164(String(formData.get("phone") ?? "").trim());
    if (!phone || !tenant_slug) backToMerchants({ e: "bad_input" });
    insertExtras.invite_phone = phone;
    insertExtras.invite_email = null;

    const { data: nu, error: authErr } = await service.auth.admin.createUser({
      phone,
      phone_confirm: true,
    });

    if (authErr || !nu?.user) backToMerchants({ e: "invite_failed" });
    userId = nu.user.id;
  } else {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    if (!email || !tenant_slug || password.length < 6) {
      backToMerchants({ e: "bad_input" });
    }

    insertExtras.invite_phone = null;
    insertExtras.invite_email = email;

    const { data: nu, error: authErr } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr || !nu?.user) backToMerchants({ e: "invite_failed" });
    userId = nu.user.id;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    try {
      await service.auth.admin.deleteUser(userId);
    } catch {
      /* ignore */
    }
    backToMerchants({ e: "no_session" });
  }

  const approveImmediately = formData.get("approve_immediately") === "on";

  const { error: insertErr } = await supabase.from("merchant_tenant_members").insert({
    user_id: userId,
    tenant_slug,
    role,
    approved_at: approveImmediately ? new Date().toISOString() : null,
    ...insertExtras,
  });

  if (insertErr) {
    try {
      await service.auth.admin.deleteUser(userId);
    } catch {
      /* ignore */
    }
    backToMerchants({ e: "insert_failed" });
  }

  revalidatePath("/ops/merchants");
  const qs: Record<string, string> = { ok: "1", t: tenant_slug };
  if (!approveImmediately) qs.pend = "1";
  backToMerchants(qs);
}

export async function removeMerchantMembership(formData: FormData): Promise<void> {
  await requirePlatformOperator("/ops/merchants");

  const id = String(formData.get("membership_id") ?? "").trim();
  if (!UUID_ROW.test(id)) {
    backToMerchants({ e: "bad_id" });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) backToMerchants({ e: "no_session" });

  const { error } = await supabase.from("merchant_tenant_members").delete().eq("id", id);
  if (error) {
    backToMerchants({ e: "delete_failed" });
  }

  revalidatePath("/ops/merchants");
  backToMerchants({ ok: "removed" });
}

export async function approveMerchantMembershipFromOps(formData: FormData): Promise<void> {
  await requirePlatformOperator("/ops/merchants");

  const id = String(formData.get("membership_id") ?? "").trim();
  if (!UUID_ROW.test(id)) {
    backToMerchants({ e: "bad_id" });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) backToMerchants({ e: "no_session" });

  const { data: existing, error: selErr } = await supabase
    .from("merchant_tenant_members")
    .select("id, approved_at")
    .eq("id", id)
    .maybeSingle();

  if (selErr || !existing) {
    backToMerchants({ e: "approve_not_found" });
  }

  const ap = (existing as { approved_at?: string | null }).approved_at;
  if (ap != null) {
    revalidatePath("/ops/merchants");
    backToMerchants({ ok: "approved_already" });
  }

  const { error } = await supabase
    .from("merchant_tenant_members")
    .update({ approved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    backToMerchants({ e: "approve_failed" });
  }

  revalidatePath("/ops/merchants");
  backToMerchants({ ok: "approved" });
}

/** 플랫폼 운영자만: 멤버별 신규 주문 Resend 수신 여부 */
export async function setMerchantNotifyOrderEmailFromOps(formData: FormData): Promise<void> {
  await requirePlatformOperator("/ops/merchants");

  const id = String(formData.get("membership_id") ?? "").trim();
  if (!UUID_ROW.test(id)) {
    backToMerchants({ e: "bad_id" });
  }

  const raw = String(formData.get("notify_order_email") ?? "").trim();
  if (raw !== "0" && raw !== "1") {
    backToMerchants({ e: "notify_bad_value" });
  }
  const notify_order_email = raw === "1";

  const supabase = await createSupabaseServerClient();
  if (!supabase) backToMerchants({ e: "no_session" });

  const { data, error } = await supabase
    .from("merchant_tenant_members")
    .update({ notify_order_email })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    backToMerchants({ e: "notify_update_failed" });
  }
  if (!data) {
    backToMerchants({ e: "notify_not_found" });
  }

  revalidatePath("/ops/merchants");
  backToMerchants({ ok: "notify_email" });
}
