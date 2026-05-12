import { createServiceSupabase } from "@/lib/supabase/create-service-client";

const MAX_ACTION = 120;

/**
 * 점주 콘솀 변경 감사 로그(비차단). service role 이 없거나 insert 실패해도 본 업무는 계속됩니다.
 */
export async function recordMerchantAuditEvent(input: {
  tenantSlug: string;
  actorUserId: string;
  action: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  const tenant = input.tenantSlug.trim();
  const actor = input.actorUserId.trim();
  const action = input.action.trim().slice(0, MAX_ACTION);
  if (!tenant || !actor || !action) return;

  let detail: Record<string, unknown> = {};
  if (input.detail && typeof input.detail === "object") {
    try {
      detail = JSON.parse(JSON.stringify(input.detail)) as Record<string, unknown>;
    } catch {
      detail = {};
    }
  }

  const client = createServiceSupabase();
  if (!client) return;

  const { error } = await client.from("merchant_audit_events").insert({
    tenant_slug: tenant,
    actor_user_id: actor,
    action,
    detail,
  });

  if (error) {
    console.error("[recordMerchantAuditEvent]", error.code ?? "", error.message);
  }
}
