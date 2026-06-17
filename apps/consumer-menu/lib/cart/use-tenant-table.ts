"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  CHAYA_TABLE_PREF_CHANGED_EVENT,
  readTablePref,
  tablePrefStorageKey,
} from "@/lib/cart/table-pref";

/** URL `?table=` 우선, 없으면 로컬 저장값. QR·장바구니 입력 후 헤더·링크가 같이 갱신됩니다. */
export function useTenantTableNumber(tenant: string): string {
  const searchParams = useSearchParams();
  const queryTable = searchParams.get("table")?.trim() ?? "";
  const [storedTable, setStoredTable] = useState("");

  const refreshStored = useCallback(() => {
    setStoredTable(readTablePref(tenant));
  }, [tenant]);

  useEffect(() => {
    refreshStored();
  }, [refreshStored, queryTable]);

  useEffect(() => {
    const onChanged = (ev: Event) => {
      const detail = (ev as CustomEvent<{ tenant?: string }>).detail;
      if (!detail?.tenant || detail.tenant === tenant.trim()) refreshStored();
    };
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === tablePrefStorageKey(tenant)) refreshStored();
    };
    window.addEventListener(CHAYA_TABLE_PREF_CHANGED_EVENT, onChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHAYA_TABLE_PREF_CHANGED_EVENT, onChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [tenant, refreshStored]);

  return queryTable || storedTable;
}
