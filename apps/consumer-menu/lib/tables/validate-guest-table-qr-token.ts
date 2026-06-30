import "server-only";

import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

import { isTableQrTokenConfigured, verifyTableQrToken } from "@/lib/security/table-qr-token";
import type { GuestOrderErrorCode } from "@/lib/i18n/guest-order-error-codes";

/** 등록 테이블 매장 — QR 토큰(exp·sig) 검증. 비밀키 없으면 스킵(로컬). */
export async function validateGuestTableQrToken(
  tenantSlug: string,
  tableNo: string,
  expSec: number | null | undefined,
  sig: string | null | undefined,
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
    console.error("[validateGuestTableQrToken] hasTables", error.code ?? "", error.message);
    return { ok: false, code: "table_qr_invalid" };
  }
  if (hasTables !== true) return { ok: true };

  const exp = typeof expSec === "number" ? expSec : Number(expSec);
  const signature = typeof sig === "string" ? sig.trim() : "";
  const verified = verifyTableQrToken(slug, code, exp, signature);
  if (!verified.ok) return { ok: false, code: verified.code };
  return { ok: true };
}
