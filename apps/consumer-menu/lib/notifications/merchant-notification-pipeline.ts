import type { SupabaseClient } from "@supabase/supabase-js";

import { orderStatusLabel } from "@/lib/orders/order-status-label";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

import { getServerSiteBaseUrl } from "./site-base-url";

export type MerchantNotificationKind = "guest_order_created" | "order_status_changed";

async function loadInviteEmailsForTenant(
  svc: SupabaseClient,
  tenantSlug: string,
): Promise<string[]> {
  const { data, error } = await svc
    .from("merchant_tenant_members")
    .select("invite_email")
    .eq("tenant_slug", tenantSlug)
    .not("approved_at", "is", null);

  if (error || !data) return [];

  const set = new Set<string>();
  for (const row of data) {
    const r = row as { invite_email?: unknown };
    const e = typeof r.invite_email === "string" ? r.invite_email.trim().toLowerCase() : "";
    if (e.includes("@")) set.add(e);
  }
  return [...set].slice(0, 20);
}

async function insertMerchantNotificationEvent(input: {
  tenantSlug: string;
  kind: MerchantNotificationKind;
  orderId: string | null;
  summary: string;
  payload: Record<string, unknown>;
}): Promise<string | null> {
  const svc = createServiceSupabase();
  if (!svc) return null;

  const { data, error } = await svc
    .from("merchant_notification_events")
    .insert({
      tenant_slug: input.tenantSlug,
      kind: input.kind,
      order_id: input.orderId,
      summary: input.summary.slice(0, 500),
      payload: input.payload,
      email_status: "skipped",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[insertMerchantNotificationEvent]", error?.message ?? "");
    return null;
  }
  const id = (data as { id?: unknown }).id;
  return typeof id === "string" ? id : null;
}

async function trySendResendForEvent(
  eventId: string,
  subject: string,
  textBody: string,
  htmlBody: string,
  recipients: string[],
): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const svc = createServiceSupabase();
  if (!svc || !key || !from || recipients.length === 0) {
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: subject.slice(0, 200),
        text: textBody,
        html: htmlBody,
      }),
    });

    const raw = await res.text();

    if (!res.ok) {
      await svc
        .from("merchant_notification_events")
        .update({
          email_status: "failed",
          email_detail: raw.slice(0, 500),
        })
        .eq("id", eventId);
      return;
    }

    let rid = "sent";
    try {
      const j = JSON.parse(raw) as { id?: string };
      if (j?.id) rid = j.id;
    } catch {
      /* ignore */
    }

    await svc
      .from("merchant_notification_events")
      .update({
        email_status: "sent",
        email_detail: rid.slice(0, 500),
      })
      .eq("id", eventId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await svc
      .from("merchant_notification_events")
      .update({
        email_status: "failed",
        email_detail: msg.slice(0, 500),
      })
      .eq("id", eventId);
  }
}

export async function runMerchantGuestOrderCreatedNotification(input: {
  tenantSlug: string;
  orderId: string;
  totalPrice: number;
  tableNo?: string | null;
}): Promise<void> {
  const svc = createServiceSupabase();
  if (!svc) return;

  const tablePart = input.tableNo?.trim() ? ` · 테이블 ${input.tableNo!.trim()}` : "";
  const summary = `손님 주문 접수 · ${input.totalPrice.toLocaleString("ko-KR")}원${tablePart}`;

  const eventId = await insertMerchantNotificationEvent({
    tenantSlug: input.tenantSlug,
    kind: "guest_order_created",
    orderId: input.orderId,
    summary,
    payload: {
      order_id: input.orderId,
      total_price: input.totalPrice,
      table_no: input.tableNo?.trim() ?? null,
    },
  });
  if (!eventId) return;

  const recipients = await loadInviteEmailsForTenant(svc, input.tenantSlug);
  const base = getServerSiteBaseUrl();
  const path = `/m/${encodeURIComponent(input.tenantSlug)}/orders`;
  const ordersLink = base ? `${base}${path}` : path;

  const subject = `[CHAYA] ${input.tenantSlug} 새 주문`;
  const text = `새 주문이 접수되었습니다.\n주문 ID: ${input.orderId}\n합계: ${input.totalPrice.toLocaleString("ko-KR")}원${tablePart}\n\n주문 큐: ${ordersLink}`;
  const html = `<p>새 주문이 접수되었습니다.</p><p>주문 ID: <code>${input.orderId}</code></p><p>합계: ${input.totalPrice.toLocaleString("ko-KR")}원${tablePart ? `<br/>${tablePart}` : ""}</p><p><a href="${ordersLink}">주문 큐 열기</a></p>`;

  await trySendResendForEvent(eventId, subject, text, html, recipients);
}

export function fireMerchantGuestOrderCreatedNotification(input: {
  tenantSlug: string;
  orderId: string;
  totalPrice: number;
  tableNo?: string | null;
}): void {
  void runMerchantGuestOrderCreatedNotification(input).catch((e) => {
    console.error("[fireMerchantGuestOrderCreatedNotification]", e);
  });
}

export async function runMerchantOrderStatusChangedNotification(input: {
  tenantSlug: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
}): Promise<void> {
  const fromL = input.fromStatus?.trim() ? orderStatusLabel(input.fromStatus.trim()) : "(이전 없음)";
  const toL = orderStatusLabel(input.toStatus);
  const summary = `주문 상태 변경 · ${fromL} → ${toL}`;

  await insertMerchantNotificationEvent({
    tenantSlug: input.tenantSlug,
    kind: "order_status_changed",
    orderId: input.orderId,
    summary,
    payload: {
      order_id: input.orderId,
      from: input.fromStatus?.trim() ?? null,
      to: input.toStatus,
    },
  });
}

export function fireMerchantOrderStatusChangedNotification(input: {
  tenantSlug: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
}): void {
  void runMerchantOrderStatusChangedNotification(input).catch((e) => {
    console.error("[fireMerchantOrderStatusChangedNotification]", e);
  });
}
