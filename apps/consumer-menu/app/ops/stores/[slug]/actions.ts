"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordMerchantAuditEvent } from "@/lib/merchant/record-merchant-audit";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import { resetTenantOrdersForOps } from "@/lib/platform/reset-tenant-orders-for-ops";
import { sendPlatformAnnouncementToTenant } from "@/lib/platform/send-platform-announcement-to-tenant";
import { updateTenantBillingPlan } from "@/lib/platform/update-tenant-billing-plan";
import { updateTenantKakaoAlimtalkLinked } from "@/lib/platform/update-tenant-kakao-alimtalk-linked";
import { updateTenantOrdersAccepting } from "@/lib/platform/update-tenant-orders-accepting";
import { parseTenantBillingPlan } from "@/lib/tenant/tenant-billing-plan";
import { normalizeTenantSlug } from "@/lib/tenant/tenant-slug";

function backToStoreDetail(tenantSlug: string, query: Record<string, string>): never {
  const enc = encodeURIComponent(tenantSlug);
  const sp = new URLSearchParams(query);
  redirect(`/ops/stores/${enc}?${sp.toString()}`);
}

function revalidateAfterStoreOpsChange(tenantSlug: string): void {
  const tEnc = encodeURIComponent(tenantSlug);
  revalidatePath(`/ops/stores/${tEnc}`);
  revalidatePath("/ops/stores");
  revalidatePath(`/m/${tEnc}`, "layout");
  revalidatePath(`/m/${tEnc}/more`);
  revalidatePath(`/m/${tEnc}/more/hours`);
  revalidatePath(`/m/${tEnc}/more/notifications`);
  revalidatePath(`/m/${tEnc}/notifications`);
  revalidatePath(`/m/${tEnc}/dashboard`);
  revalidatePath(`/m/${tEnc}/orders`);
  revalidatePath(`/m/${tEnc}/analytics`);
  revalidatePath(`/t/${tEnc}`, "layout");
}

function parseTenantFromForm(formData: FormData): string | null {
  const tenant_slug = normalizeTenantSlug(String(formData.get("tenant_slug") ?? "").trim());
  return tenant_slug || null;
}

export async function setTenantKakaoAlimtalkLinkedFromOps(formData: FormData): Promise<void> {
  const { userId: actorUserId } = await requirePlatformOperator("/ops/stores");

  const tenant_slug = parseTenantFromForm(formData);
  if (!tenant_slug) {
    backToStoreDetail(String(formData.get("tenant_slug") ?? "unknown"), { e: "bad_tenant" });
  }

  const intent = String(formData.get("intent") ?? "").trim();
  const linked = intent === "link";

  const result = await updateTenantKakaoAlimtalkLinked(tenant_slug, linked);
  if (!result.ok) {
    backToStoreDetail(tenant_slug, { e: result.code });
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant_slug,
    actorUserId,
    action: linked ? "ops.kakao_alimtalk_link" : "ops.kakao_alimtalk_unlink",
    detail: { linked },
  });

  revalidateAfterStoreOpsChange(tenant_slug);
  backToStoreDetail(tenant_slug, { ok: linked ? "kakao_linked" : "kakao_unlinked" });
}

export async function sendStoreAnnouncementFromOps(formData: FormData): Promise<void> {
  const { userId: actorUserId } = await requirePlatformOperator("/ops/stores");

  const tenant_slug = parseTenantFromForm(formData);
  if (!tenant_slug) {
    backToStoreDetail(String(formData.get("tenant_slug") ?? "unknown"), { e: "bad_tenant" });
  }

  const body = String(formData.get("body") ?? "");
  const result = await sendPlatformAnnouncementToTenant({
    actorUserId,
    tenantSlug: tenant_slug,
    body,
  });

  if (!result.ok) {
    const code =
      result.code === "bad_body" ? "notice_bad_body" : result.code === "db" ? "db" : result.code;
    backToStoreDetail(tenant_slug, { e: code });
  }

  revalidateAfterStoreOpsChange(tenant_slug);
  backToStoreDetail(tenant_slug, { ok: "notice_sent" });
}

export async function setStoreOrdersAcceptingFromOps(formData: FormData): Promise<void> {
  const { userId: actorUserId } = await requirePlatformOperator("/ops/stores");

  const tenant_slug = parseTenantFromForm(formData);
  if (!tenant_slug) {
    backToStoreDetail(String(formData.get("tenant_slug") ?? "unknown"), { e: "bad_tenant" });
  }

  const intent = String(formData.get("intent") ?? "").trim();
  const ordersAccepting = intent === "resume";

  const result = await updateTenantOrdersAccepting(tenant_slug, ordersAccepting);
  if (!result.ok) {
    backToStoreDetail(tenant_slug, { e: result.code });
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant_slug,
    actorUserId,
    action: ordersAccepting ? "ops.orders_accepting_on" : "ops.orders_accepting_off",
    detail: { orders_accepting: ordersAccepting, source: "ops_store_detail" },
  });

  revalidateAfterStoreOpsChange(tenant_slug);
  backToStoreDetail(tenant_slug, {
    ok: ordersAccepting ? "orders_resumed" : "orders_paused",
  });
}

export async function setStoreBillingPlanFromOps(formData: FormData): Promise<void> {
  const { userId: actorUserId } = await requirePlatformOperator("/ops/stores");

  const tenant_slug = parseTenantFromForm(formData);
  if (!tenant_slug) {
    backToStoreDetail(String(formData.get("tenant_slug") ?? "unknown"), { e: "bad_tenant" });
  }

  const plan = parseTenantBillingPlan(String(formData.get("billing_plan") ?? ""));
  const result = await updateTenantBillingPlan(tenant_slug, plan);
  if (!result.ok) {
    backToStoreDetail(tenant_slug, { e: result.code });
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant_slug,
    actorUserId,
    action: "ops.billing_plan_set",
    detail: { billing_plan: plan },
  });

  revalidateAfterStoreOpsChange(tenant_slug);
  backToStoreDetail(tenant_slug, { ok: "plan_saved" });
}

export async function resetStoreOrdersFromOps(formData: FormData): Promise<void> {
  const { userId: actorUserId } = await requirePlatformOperator("/ops/stores");

  const tenant_slug = parseTenantFromForm(formData);
  if (!tenant_slug) {
    backToStoreDetail(String(formData.get("tenant_slug") ?? "unknown"), { e: "bad_tenant" });
  }

  const result = await resetTenantOrdersForOps({
    tenantSlug: tenant_slug,
    confirmSlug: String(formData.get("confirm_slug") ?? ""),
  });

  if (!result.ok) {
    const code =
      result.code === "confirm_mismatch"
        ? "reset_confirm"
        : result.code === "not_allowed"
          ? "reset_not_allowed"
          : result.code === "too_many"
            ? "reset_too_many"
            : result.code;
    backToStoreDetail(tenant_slug, { e: code });
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant_slug,
    actorUserId,
    action: "ops.orders_reset",
    detail: { deleted_count: result.deletedCount },
  });

  revalidateAfterStoreOpsChange(tenant_slug);
  backToStoreDetail(tenant_slug, { ok: "orders_reset", n: String(result.deletedCount) });
}
