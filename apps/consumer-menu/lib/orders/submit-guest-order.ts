import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry, withSupabaseWriteRetry } from "@/lib/supabase/transient-retry";

import type { GuestOrderLine } from "./guest-order-validation";
import {
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
  const orderedItems = linesCheck.items;

  const total_price = orderedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!Number.isFinite(total_price) || total_price < 0) {
    return { ok: false, message: "주문 금액이 올바르지 않습니다." };
  }

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

  return { ok: true, orderId: String(id) };
}
