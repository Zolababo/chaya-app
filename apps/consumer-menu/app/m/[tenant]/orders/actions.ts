"use server";

import { redirect } from "next/navigation";

import { requireMerchantOrderMutation } from "@/lib/merchant/require-merchant-action";
import { isMerchantOrderStatus } from "@/lib/orders/merchant-status-constants";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function redirectBack(tenant: string, opts?: { err?: string; ok?: string; statusFilter?: string | null }): never {
  const q = new URLSearchParams();
  if (opts?.err) q.set("e", opts.err);
  if (opts?.ok) q.set("ok", opts.ok);
  if (opts?.statusFilter && isMerchantOrderStatus(opts.statusFilter)) {
    q.set("status", opts.statusFilter);
  }
  const suffix = q.toString() ? `?${q}` : "";
  redirect(`/m/${encodeURIComponent(tenant)}/orders${suffix}`);
}

export async function updateOrderStatusFromForm(formData: FormData): Promise<void> {
  await requireMerchantOrderMutation(formData);

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const orderId = String(formData.get("order_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const currentStatus = String(formData.get("current_status") ?? "").trim();
  const filterRaw = String(formData.get("filter_status") ?? "").trim();
  const statusFilter = isMerchantOrderStatus(filterRaw) ? filterRaw : null;

  if (!tenant || !UUID_RE.test(orderId) || !isMerchantOrderStatus(status)) {
    redirectBack(tenant || "invalid", { err: "bad_input", statusFilter });
  }
  if (currentStatus && status === currentStatus) {
    redirectBack(tenant, { ok: "no_change", statusFilter });
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

  redirectBack(tenant, { ok: "status_saved", statusFilter });
}
