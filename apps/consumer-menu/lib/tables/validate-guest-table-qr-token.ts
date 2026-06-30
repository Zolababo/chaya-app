import "server-only";

import { cookies } from "next/headers";

import type { GuestOrderErrorCode } from "@/lib/i18n/guest-order-error-codes";
import { guestVisitClosedAfterGateScan } from "@/lib/orders/guest-visit-order-gate";
import { sanitizeGuestSessionId } from "@/lib/orders/guest-order-validation";
import {
  isTableQrTokenConfigured,
  TABLE_ORDER_GATE_COOKIE,
  verifyTableOrderGate,
} from "@/lib/security/table-qr-token";
import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

/** 등록 테이블 매장 — QR 스캔 쿠키 + 결제완료 후 방문 종료 검증. */
export async function validateGuestTableOrderGate(
  tenantSlug: string,
  tableNo: string,
  guestSessionId?: string | null,
): Promise<{ ok: true } | { ok: false; code: GuestOrderErrorCode }> {
  if (!isTableQrTokenConfigured()) return { ok: true };

  const slug = tenantSlug.trim();
  const code = tableNo.trim();
  if (!slug || !code) return { ok: false, code: "table_qr_invalid" };

  const client = createConsumerSupabase();
  if (!client) return { ok: false, code: "table_qr_invalid" };

  const { data: hasTables, error } = await withSupabaseReadRetry(() =>
    client.rpc("tenant_has_active_tables", { p_tenant: slug }),
  );
  if (error) {
    console.error("[validateGuestTableOrderGate] hasTables", error.code ?? "", error.message);
    return { ok: false, code: "table_qr_invalid" };
  }
  if (hasTables !== true) return { ok: true };

  const jar = await cookies();
  const gateRaw = jar.get(TABLE_ORDER_GATE_COOKIE)?.value;
  const verified = verifyTableOrderGate(gateRaw, slug, code);
  if (!verified.ok) return { ok: false, code: verified.code };

  const sid = sanitizeGuestSessionId(guestSessionId ?? null);
  if (sid && verified.iatSec > 0) {
    const visitClosed = await guestVisitClosedAfterGateScan(client, slug, sid, verified.iatSec);
    if (visitClosed) return { ok: false, code: "visit_closed" };
  }

  return { ok: true };
}
