import "server-only";

import { recordMerchantAuditEvent } from "@/lib/merchant/record-merchant-audit";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { normalizeTenantSlug } from "@/lib/tenant/tenant-slug";

export type SendStoreAnnouncementResult =
  | { ok: true }
  | { ok: false; code: "bad_tenant" | "bad_body" | "no_service" | "db"; message: string };

export async function sendPlatformAnnouncementToTenant(input: {
  actorUserId: string;
  tenantSlug: string;
  body: string;
}): Promise<SendStoreAnnouncementResult> {
  const tenant_slug = normalizeTenantSlug(input.tenantSlug);
  if (!tenant_slug) {
    return { ok: false, code: "bad_tenant", message: "매장 식별자가 올바르지 않습니다." };
  }

  const body = input.body.trim();
  if (body.length < 2) {
    return { ok: false, code: "bad_body", message: "공지 내용을 2자 이상 입력해주세요." };
  }
  if (body.length > 2000) {
    return { ok: false, code: "bad_body", message: "공지는 2,000자 이하로 입력해주세요." };
  }

  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, code: "no_service", message: "Supabase 서버 설정(SERVICE_ROLE)이 없습니다." };
  }

  const summary = body.length > 240 ? `${body.slice(0, 237)}…` : body;
  const { error } = await client.from("merchant_notification_events").insert({
    tenant_slug,
    kind: "platform_announcement" as const,
    order_id: null,
    summary,
    payload: {
      fullText: body,
      target: "single",
      targetLabel: "이 매장",
    },
    email_status: "skipped" as const,
  });

  if (error) {
    return {
      ok: false,
      code: "db",
      message: error.message ?? "공지 저장에 실패했습니다.",
    };
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant_slug,
    actorUserId: input.actorUserId,
    action: "ops.store_announcement",
    detail: { preview: summary.slice(0, 80) },
  });

  return { ok: true };
}
