/**
 * Optional outbound POST for third-party channels (e.g. Kakao Alimtalk via your own edge function).
 * Set MERCHANT_ORDER_NOTIFY_WEBHOOK_URL (+ optional MERCHANT_ORDER_NOTIFY_WEBHOOK_SECRET Bearer).
 */

export function isMerchantOrderNotifyWebhookConfigured(): boolean {
  return Boolean(process.env.MERCHANT_ORDER_NOTIFY_WEBHOOK_URL?.trim());
}

export async function tryPostMerchantOrderNotifyWebhook(input: {
  tenantSlug: string;
  orderId: string;
  kind: "guest_order_created";
  totalPrice: number;
  tableNo?: string | null;
}): Promise<void> {
  const url = process.env.MERCHANT_ORDER_NOTIFY_WEBHOOK_URL?.trim();
  if (!url) return;

  const secret = process.env.MERCHANT_ORDER_NOTIFY_WEBHOOK_SECRET?.trim();
  const body = JSON.stringify({
    kind: input.kind,
    tenant_slug: input.tenantSlug,
    order_id: input.orderId,
    total_price: input.totalPrice,
    table_no: input.tableNo?.trim() ?? null,
    ts: new Date().toISOString(),
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("[merchantOrderNotifyWebhook]", res.status, t.slice(0, 300));
    }
  } catch (e) {
    console.error("[merchantOrderNotifyWebhook]", e instanceof Error ? e.message : e);
  }
}
