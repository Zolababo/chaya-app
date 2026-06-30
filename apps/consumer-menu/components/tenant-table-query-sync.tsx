"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { writeTableQrTokenPref } from "@/lib/cart/table-qr-token-pref";
import { persistTablePrefFromQuery, writeTablePref } from "@/lib/cart/table-pref";
import { useTenantTables } from "@/lib/consumer/tenant-tables-context";
import { normalizeTableCode } from "@/lib/tables/tenant-table-code";

type Props = {
  tenant: string;
};

/** `/t/{tenant}?table=…&exp=…&sig=…` 를 로컬에 두어 장바구니·주문과 맞춥니다. */
export function TenantTableQuerySync({ tenant }: Props) {
  const searchParams = useSearchParams();
  const raw = searchParams.get("table");
  const expRaw = searchParams.get("exp");
  const sigRaw = searchParams.get("sig");
  const { hasRegistry, isKnownCode } = useTenantTables();

  useEffect(() => {
    if (raw === null) return;
    const trimmed = raw.trim();
    if (!hasRegistry) {
      persistTablePrefFromQuery(tenant, trimmed);
      return;
    }
    const norm = normalizeTableCode(trimmed);
    if (norm.ok && isKnownCode(norm.code)) {
      writeTablePref(tenant, norm.code);
      const exp = expRaw ? Number(expRaw) : NaN;
      const sig = sigRaw?.trim() ?? "";
      if (Number.isFinite(exp) && exp > 0 && sig.length >= 8) {
        writeTableQrTokenPref(tenant, { table: norm.code, exp, sig });
      }
      const logKey = `chaya-qr-visit:${tenant}:${norm.code}`;
      if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(logKey)) {
        sessionStorage.setItem(logKey, "1");
        void fetch(`/t/${encodeURIComponent(tenant)}/qr-visit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: norm.code }),
        }).catch(() => undefined);
      }
    } else if (!trimmed) {
      persistTablePrefFromQuery(tenant, "");
    }
  }, [tenant, raw, expRaw, sigRaw, hasRegistry, isKnownCode]);

  return null;
}
