import "server-only";

import { cookies } from "next/headers";

import type { GuestOrderErrorCode } from "@/lib/i18n/guest-order-error-codes";
import {
  isTableQrTokenConfigured,
  TABLE_ORDER_GATE_COOKIE,
  verifyTableOrderGate,
} from "@/lib/security/table-qr-token";
import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

/** 등록 테이블 매장 — QR 스캔으로 발급된 HttpOnly 주문 권한 쿠키 검증. */
export async function validateGuestTableOrderGate(
  tenantSlug: string,
  tableNo: string,
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
  return { ok: true };
}
