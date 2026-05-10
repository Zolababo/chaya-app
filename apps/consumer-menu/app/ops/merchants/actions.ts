"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeKrPhoneToE164 } from "@/lib/merchant/phone-e164-kr";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

const UUID_ROW = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function backToMerchants(opts: Record<string, string>): never {
  const q = new URLSearchParams(opts);
  redirect(`/ops/merchants?${q.toString()}`);
}

export async function inviteMerchantFromOps(formData: FormData): Promise<void> {
  await requirePlatformOperator("/ops/merchants");

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = normalizeKrPhoneToE164(phoneRaw);
  const tenant_slug = String(formData.get("tenant_slug") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "owner").trim();
  const role = roleRaw === "staff" ? "staff" : "owner";

  if (!phone || !tenant_slug) {
    backToMerchants({ e: "bad_input" });
  }

  const service = createServiceSupabase();
  if (!service) {
    backToMerchants({ e: "no_service" });
  }

  const { data: nu, error: authErr } = await service.auth.admin.createUser({
    phone,
    phone_confirm: true,
  });

  if (authErr || !nu?.user) {
    backToMerchants({ e: "invite_failed" });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    try {
      await service.auth.admin.deleteUser(nu.user.id);
    } catch {
      /* ignore */
    }
    backToMerchants({ e: "no_session" });
  }

  const { error: insertErr } = await supabase.from("merchant_tenant_members").insert({
    user_id: nu.user.id,
    tenant_slug,
    role,
    invite_phone: phone,
  });

  if (insertErr) {
    try {
      await service.auth.admin.deleteUser(nu.user.id);
    } catch {
      /* ignore */
    }
    backToMerchants({ e: "insert_failed" });
  }

  revalidatePath("/ops/merchants");
  backToMerchants({ ok: "1" });
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
