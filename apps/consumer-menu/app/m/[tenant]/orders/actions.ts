"use server";

import { redirect } from "next/navigation";

import { getMerchantTokenForAction } from "@/lib/merchant/get-merchant-token-for-action";
import { isMerchantOrderStatus } from "@/lib/orders/merchant-status-constants";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function redirectBack(tenant: string, opts?: { err?: string; statusFilter?: string | null }): never {
  const q = new URLSearchParams();
  if (opts?.err) q.set("e", opts.err);
  if (opts?.statusFilter && isMerchantOrderStatus(opts.statusFilter)) {
    q.set("status", opts.statusFilter);
  }
  const suffix = q.toString() ? `?${q}` : "";
  redirect(`/m/${encodeURIComponent(tenant)}/orders${suffix}`);
}

export async function updateOrderStatusFromForm(formData: FormData): Promise<void> {
  const token = await getMerchantTokenForAction(formData);
  if (!token) {
    redirect("/m/forbidden");
  }

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const orderId = String(formData.get("order_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const filterRaw = String(formData.get("filter_status") ?? "").trim();
  const statusFilter = isMerchantOrderStatus(filterRaw) ? filterRaw : null;

  if (!tenant || !UUID_RE.test(orderId) || !isMerchantOrderStatus(status)) {
    redirectBack(tenant || "invalid", { err: "bad_input", statusFilter });
  }

  const client = createServiceSupabase();
  if (!client) {
    redirectBack(tenant, { err: "no_service", statusFilter });
  }

  const { error } = await client
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("tenant_slug", tenant);

  if (error) {
    redirectBack(tenant, { err: "db", statusFilter });
  }

  redirectBack(tenant, { statusFilter });
}
