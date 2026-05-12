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

  const { error: insertErr } = await supabase.from("merchant_tenant_members").insert({
    user_id: userId,
    tenant_slug,
    role,
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
  backToMerchants({ ok: "1", t: tenant_slug });
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
