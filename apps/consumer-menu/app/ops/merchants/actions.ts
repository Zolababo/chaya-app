"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const tenant_slug = String(formData.get("tenant_slug") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "owner").trim();
  const role = roleRaw === "staff" ? "staff" : "owner";

  if (!email || !tenant_slug || password.length < 6) {
    backToMerchants({ e: "bad_input" });
  }

  const service = createServiceSupabase();
  if (!service) {
    backToMerchants({ e: "no_service" });
  }

  const { data: nu, error: authErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
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
