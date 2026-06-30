"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { persistTablePrefFromQuery, writeTablePref } from "@/lib/cart/table-pref";
import { useTenantTables } from "@/lib/consumer/tenant-tables-context";
import { normalizeTableCode } from "@/lib/tables/tenant-table-code";

type Props = {
  tenant: string;
};

/** `/t/{tenant}?table=…` 테이블 번호만 로컬에 반영 (주문 권한은 `/qr` 스캔 쿠키). */
export function TenantTableQuerySync({ tenant }: Props) {
  const searchParams = useSearchParams();
  const raw = searchParams.get("table");
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
  }, [tenant, raw, hasRegistry, isKnownCode]);

  return null;
}
