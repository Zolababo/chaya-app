import "server-only";

import { recordMerchantAuditEvent } from "@/lib/merchant/record-merchant-audit";
import { listPlatformStores } from "@/lib/platform/list-platform-stores";
import type { PlatformStoreSummary } from "@/lib/platform/list-platform-stores";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

export type PlatformAnnouncementTarget = "all" | "active" | "at_risk" | "new";

export type SendPlatformAnnouncementResult =
  | { ok: true; sentCount: number; target: PlatformAnnouncementTarget }
  | { ok: false; message: string };

const TARGET_LABEL: Record<PlatformAnnouncementTarget, string> = {
  all: "전체 매장",
  active: "영업중만",
  at_risk: "위험 매장",
  new: "신규 매장",
};

function pickTargets(target: PlatformAnnouncementTarget, stores: PlatformStoreSummary[]): string[] {
  switch (target) {
    case "active":
      return stores.filter((s) => s.operatingStatus === "active").map((s) => s.tenantSlug);
    case "at_risk":
      return stores.filter((s) => s.atRisk).map((s) => s.tenantSlug);
    case "new":
      return stores.filter((s) => s.operatingStatus === "new").map((s) => s.tenantSlug);
    default:
      return stores.map((s) => s.tenantSlug);
  }
}

export async function sendPlatformAnnouncement(input: {
  actorUserId: string;
  target: PlatformAnnouncementTarget;
  body: string;
}): Promise<SendPlatformAnnouncementResult> {
  const body = input.body.trim();
  if (body.length < 2) {
    return { ok: false, message: "공지 내용을 2자 이상 입력해주세요." };
  }
  if (body.length > 2000) {
    return { ok: false, message: "공지는 2,000자 이하로 입력해주세요." };
  }

  const storesRes = await listPlatformStores();
  if (!storesRes.ok) {
    return { ok: false, message: storesRes.message };
  }

  const slugs = pickTargets(input.target, storesRes.stores);
  if (slugs.length === 0) {
    return { ok: false, message: `${TARGET_LABEL[input.target]} 대상 매장이 없습니다.` };
  }

  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "Supabase 서버 설정(SERVICE_ROLE)이 없습니다." };
  }

  const summary = body.length > 240 ? `${body.slice(0, 237)}…` : body;
  const rows = slugs.map((tenant_slug) => ({
    tenant_slug,
    kind: "platform_announcement" as const,
    order_id: null,
    summary,
    payload: {
      fullText: body,
      target: input.target,
      targetLabel: TARGET_LABEL[input.target],
    },
    email_status: "skipped" as const,
  }));

  const { error } = await client.from("merchant_notification_events").insert(rows);
  if (error) {
    return { ok: false, message: error.message ?? "공지 저장에 실패했습니다." };
  }

  void recordMerchantAuditEvent({
    tenantSlug: slugs[0] ?? "platform",
    actorUserId: input.actorUserId,
    action: "ops.platform_announcement",
    detail: {
      target: input.target,
      sentCount: slugs.length,
      preview: summary.slice(0, 80),
    },
  });

  return { ok: true, sentCount: slugs.length, target: input.target };
}
