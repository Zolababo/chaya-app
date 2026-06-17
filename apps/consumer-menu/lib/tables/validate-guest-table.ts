import { createConsumerSupabase } from "@/lib/supabase/create-consumer-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

import { normalizeTableCode, tableCodeLookupVariants } from "./tenant-table-code";

export type GuestTableValidationResult =
  | { ok: true; tableNo: string }
  | { ok: false; code: "table_required" | "invalid_table" | "invalid_table_format" };

/** 매장에 활성 테이블이 있으면 목록 일치 필수, 없으면 선택(레거시 자유 입력 허용). */
export async function validateGuestTableNo(
  tenantSlug: string,
  tableNo: string | null | undefined,
): Promise<GuestTableValidationResult> {
  const slug = tenantSlug.trim();
  const client = createConsumerSupabase();
  if (!client) {
    return { ok: false, code: "invalid_table" };
  }

  const { data: hasTables, error: hasErr } = await withSupabaseReadRetry(() =>
    client.rpc("tenant_has_active_tables", { p_tenant: slug }),
  );
  if (hasErr) {
    console.error("[validateGuestTableNo] hasTables", hasErr.code ?? "", hasErr.message);
    return { ok: false, code: "invalid_table" };
  }

  const registry = hasTables === true;
  const raw = (tableNo ?? "").trim();
  if (!registry) {
    if (!raw) return { ok: true, tableNo: "" };
    const norm = normalizeTableCode(raw);
    if (!norm.ok) return { ok: false, code: "invalid_table_format" };
    return { ok: true, tableNo: norm.code };
  }

  if (!raw) return { ok: false, code: "table_required" };
  const norm = normalizeTableCode(raw);
  if (!norm.ok) return { ok: false, code: "invalid_table_format" };

  const variants = tableCodeLookupVariants(raw);
  for (const code of variants) {
    const { data: valid, error: validErr } = await withSupabaseReadRetry(() =>
      client.rpc("tenant_table_is_valid", { p_tenant: slug, p_code: code }),
    );
    if (validErr) {
      console.error("[validateGuestTableNo] isValid", validErr.code ?? "", validErr.message);
      return { ok: false, code: "invalid_table" };
    }
    if (valid === true) return { ok: true, tableNo: code };
  }
  return { ok: false, code: "invalid_table" };
}
