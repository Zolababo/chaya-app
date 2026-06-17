"use server";

import { redirect } from "next/navigation";

import { canMutateMerchantOrders } from "@/lib/merchant/merchant-role-capabilities";
import { requireMerchantOrderMutation } from "@/lib/merchant/require-merchant-action";
import { recordMerchantAuditEvent } from "@/lib/merchant/record-merchant-audit";
import { fireMerchantOrderStatusChangedNotification } from "@/lib/notifications/merchant-notification-pipeline";
import { isMerchantOrdersTab, type MerchantOrdersTab } from "@/lib/merchant/merchant-orders-tab";
import { ordersTabAfterStatusChange } from "@/lib/orders/merchant-order-stage";
import { isMerchantCancelReason } from "@/lib/orders/merchant-cancel-reasons";
import { isMerchantOrderStatus, type MerchantOrderStatus } from "@/lib/orders/merchant-status-constants";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

const BATCH_ACCEPT_MAX = 80;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function redirectBack(
  tenant: string,
  opts?: { err?: string; ok?: string; ordersTab?: MerchantOrdersTab | null },
): never {
  const q = new URLSearchParams();
  if (opts?.err) q.set("e", opts.err);
  if (opts?.ok) q.set("ok", opts.ok);
  if (opts?.ordersTab && isMerchantOrdersTab(opts.ordersTab)) {
    q.set("tab", opts.ordersTab);
  }
  const suffix = q.toString() ? `?${q}` : "";
  redirect(`/m/${encodeURIComponent(tenant)}/orders${suffix}`);
}

export async function updateOrderStatusFromForm(formData: FormData): Promise<void> {
  const { userId, role } = await requireMerchantOrderMutation(formData);

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const orderId = String(formData.get("order_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const currentStatus = String(formData.get("current_status") ?? "").trim();
  const tabRaw = String(formData.get("orders_tab") ?? "").trim();
  const ordersTab = isMerchantOrdersTab(tabRaw) ? tabRaw : null;

  if (!canMutateMerchantOrders(role)) {
    redirectBack(tenant || "invalid", { err: "no_order_mutate", ordersTab });
  }

  if (!tenant || !UUID_RE.test(orderId) || !isMerchantOrderStatus(status)) {
    redirectBack(tenant || "invalid", { err: "bad_input", ordersTab });
  }
  if (currentStatus && status === currentStatus) {
    redirectBack(tenant, { ok: "no_change", ordersTab });
  }

  const client = createServiceSupabase();
  if (!client) {
    redirectBack(tenant, { err: "no_service", ordersTab });
  }

  const cancelReasonRaw = String(formData.get("cancel_reason") ?? "").trim();
  if (status === "cancelled" && !isMerchantCancelReason(cancelReasonRaw)) {
    redirectBack(tenant, { err: "cancel_reason", ordersTab });
  }

  const patch: { status: string; cancel_reason?: string | null } = { status };
  if (status === "cancelled") {
    patch.cancel_reason = cancelReasonRaw;
  }

  let { error } = await client
    .from("orders")
    .update(patch)
    .eq("id", orderId)
    .eq("tenant_slug", tenant);

  if (error && status === "cancelled" && /cancel_reason|column.*does not exist/i.test(error.message ?? "")) {
    ({ error } = await client
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .eq("tenant_slug", tenant));
  }

  if (error) {
    redirectBack(tenant, { err: "db", ordersTab });
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId: userId,
    action: "order_status_update",
    detail: {
      order_id: orderId,
      status,
      previous_status: currentStatus || null,
      cancel_reason: status === "cancelled" ? cancelReasonRaw : null,
    },
  });

  fireMerchantOrderStatusChangedNotification({
    tenantSlug: tenant,
    orderId,
    fromStatus: currentStatus?.trim() || null,
    toStatus: status,
  });

  // "all" 탭에서 처리했으면 전체 탭으로 복귀, 아니면 다음 단계 탭으로
  const nextTab: MerchantOrdersTab = ordersTab === "all"
    ? "all"
    : (isMerchantOrderStatus(status) ? ordersTabAfterStatusChange(status) : ordersTab ?? "all");

  redirectBack(tenant, { ok: "status_saved", ordersTab: nextTab });
}

/** 새 주문(pending) 전건 접수 → preparing (준비중으로 바로 진입). */
export async function batchAcceptPendingOrdersFromForm(formData: FormData): Promise<void> {
  const { userId, role } = await requireMerchantOrderMutation(formData);

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  if (!canMutateMerchantOrders(role)) {
    redirectBack(tenant || "invalid", { err: "no_order_mutate", ordersTab: "pending" });
  }
  if (!tenant) {
    redirectBack("invalid", { err: "bad_input", ordersTab: "pending" });
  }

  const client = createServiceSupabase();
  if (!client) {
    redirectBack(tenant, { err: "no_service", ordersTab: "pending" });
  }

  const { count: pendingTotal, error: countErr } = await client
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("tenant_slug", tenant)
    .eq("status", "pending");

  if (countErr) {
    redirectBack(tenant, { err: "db", ordersTab: "pending" });
  }

  const total = pendingTotal ?? 0;
  if (total === 0) {
    redirectBack(tenant, { ok: "batch_none", ordersTab: "pending" });
  }
  if (total > BATCH_ACCEPT_MAX) {
    redirectBack(tenant, { err: "batch_limit", ordersTab: "pending" });
  }

  const { data: pendingRows, error: listErr } = await client
    .from("orders")
    .select("id")
    .eq("tenant_slug", tenant)
    .eq("status", "pending");

  if (listErr) {
    redirectBack(tenant, { err: "db", ordersTab: "pending" });
  }

  const ids = (pendingRows ?? [])
    .map((r) => (typeof (r as { id?: unknown }).id === "string" ? (r as { id: string }).id : ""))
    .filter(Boolean);

  const { error: updateErr } = await client
    .from("orders")
    .update({ status: "preparing" })
    .eq("tenant_slug", tenant)
    .in("id", ids);

  if (updateErr) {
    redirectBack(tenant, { err: "db", ordersTab: "pending" });
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId: userId,
    action: "orders_batch_accept",
    detail: { count: ids.length, order_ids: ids.slice(0, 20) },
  });

  for (const orderId of ids) {
    fireMerchantOrderStatusChangedNotification({
      tenantSlug: tenant,
      orderId,
      fromStatus: "pending",
      toStatus: "preparing",
    });
  }

  redirectBack(tenant, { ok: "batch_accept", ordersTab: "cooking" });
}
