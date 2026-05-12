import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry, withSupabaseWriteRetry } from "@/lib/supabase/transient-retry";

import { fireMerchantGuestOrderCreatedNotification } from "@/lib/notifications/merchant-notification-pipeline";

import type { GuestOrderLine } from "./guest-order-validation";
import {
  GUEST_ORDER_LIMITS,
  sanitizeGuestOrderLines,
  sanitizeGuestSessionId,
  sanitizeTenantSlug,
} from "./guest-order-validation";

export type { GuestOrderLine } from "./guest-order-validation";

export type SubmitGuestOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; message: string };

const MAX_TABLE = 30;
const MAX_NOTE = 500;

export async function submitGuestOrder(input: {
  tenant: string;
  lines: GuestOrderLine[];
  guestSessionId?: string | null;
  tableNo?: string | null;
  guestNote?: string | null;
}): Promise<SubmitGuestOrderResult> {
  const tenantCheck = sanitizeTenantSlug(input.tenant);
  if (!tenantCheck.ok) {
    return { ok: false, message: tenantCheck.message };
  }
  const slug = tenantCheck.slug;

  const linesCheck = sanitizeGuestOrderLines(input.lines);
  if (!linesCheck.ok) {
    return { ok: false, message: linesCheck.message };
  }
  let orderedItems = linesCheck.items;

  const client = createConsumerSupabase();
  if (!client) {
    return { ok: false, message: "Supabase 환경 변수가 없어 주문을 보낼 수 없습니다." };
  }

  const menuIds = [...new Set(orderedItems.map((row) => row.id))];
  if (menuIds.length > 0) {
    const { data: soldRows, error: soldErr } = await withSupabaseReadRetry(() =>
      client.from("ChayaMenus").select("id,is_sold_out").eq("tenant_slug", slug).in("id", menuIds),
    );
    if (soldErr) {
      console.error("[submitGuestOrder] soldOutCheck", soldErr.code ?? "", soldErr.message);
      return { ok: false, message: "메뉴 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
    }
    for (const r of soldRows ?? []) {
      const rec = r as { id?: unknown; is_sold_out?: unknown };
      const flag = rec.is_sold_out;
      if (flag === true || flag === "true" || flag === "t" || flag === 1 || flag === "1") {
        return {
          ok: false,
          message: "품절로 표시된 메뉴가 포함되어 있습니다. 메뉴판을 새로고침한 뒤 장바구니를 다시 담아 주세요.",
        };
      }
    }
    if ((soldRows ?? []).length !== menuIds.length) {
      return {
        ok: false,
        message: "메뉴판이 바뀌었거나 일부 메뉴를 찾을 수 없습니다. 장바구니를 비운 뒤 다시 담아 주세요.",
      };
    }

    const { data: priceRows, error: priceErr } = await withSupabaseReadRetry(() =>
      client.from("ChayaMenus").select("id,name,price").eq("tenant_slug", slug).in("id", menuIds),
    );
    if (priceErr) {
      console.error("[submitGuestOrder] menuPrice", priceErr.code ?? "", priceErr.message);
      return { ok: false, message: "메뉴 가격을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
    }

    const canon = new Map<string, { name: string; price: number }>();
    const maxName = GUEST_ORDER_LIMITS.maxMenuNameLen;
    for (const r of priceRows ?? []) {
      const rec = r as { id?: unknown; name?: unknown; price?: unknown };
      if (typeof rec.id !== "string" || typeof rec.name !== "string") continue;
      const p = typeof rec.price === "number" ? rec.price : Number(rec.price);
      if (!Number.isFinite(p) || p < 0 || p > GUEST_ORDER_LIMITS.maxUnitPrice) continue;
      const name = rec.name.trim().slice(0, maxName);
      if (!name) continue;
      canon.set(rec.id, { name, price: p });
    }

    if (canon.size !== menuIds.length) {
      return {
        ok: false,
        message: "메뉴판이 바뀌었거나 일부 메뉴를 찾을 수 없습니다. 장바구니를 비운 뒤 다시 담아 주세요.",
      };
    }

    orderedItems = orderedItems.map((line) => {
      const row = canon.get(line.id);
      if (!row) return line;
      return { ...line, name: row.name, price: row.price };
    });
  }

  const total_price = orderedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!Number.isFinite(total_price) || total_price < 0) {
    return { ok: false, message: "주문 금액이 올바르지 않습니다." };
  }
  if (total_price > GUEST_ORDER_LIMITS.maxTotalPrice) {
    return { ok: false, message: "주문 합계가 허용 범위를 넘습니다." };
  }

  const row: Record<string, unknown> = {
    items: orderedItems,
    total_price,
    tenant_slug: slug,
    status: "pending",
  };

  const sid = sanitizeGuestSessionId(input.guestSessionId ?? null);
  if (sid) {
    row.guest_session_id = sid;
  }

  const table = input.tableNo?.trim().slice(0, MAX_TABLE) ?? "";
  if (table) {
    row.table_no = table;
  }

  const note = input.guestNote?.trim().slice(0, MAX_NOTE) ?? "";
  if (note) {
    row.guest_note = note;
  }

  const { data, error } = await withSupabaseWriteRetry(() =>
    client.from("orders").insert(row).select("id").single(),
  );

  if (error) {
    console.error("[submitGuestOrder]", error.code ?? "", error.message);
    return {
      ok: false,
      message: "주문을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
  const id = data && typeof data === "object" && "id" in data ? (data as { id: unknown }).id : null;
  if (id == null) {
    return { ok: false, message: "주문 번호를 받지 못했습니다." };
  }
  const orderIdStr = String(id);
  fireMerchantGuestOrderCreatedNotification({
    tenantSlug: slug,
    orderId: orderIdStr,
    totalPrice: total_price,
    tableNo: table || null,
  });

  return { ok: true, orderId: orderIdStr };
}
