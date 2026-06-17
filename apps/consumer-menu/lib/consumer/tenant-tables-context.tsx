"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { TenantTableRow } from "@/lib/tables/types";

type TenantTablesContextValue = {
  tenant: string;
  /** 활성 테이블 목록 (비어 있으면 레거시 자유 입력). */
  tables: TenantTableRow[];
  hasRegistry: boolean;
  codeSet: ReadonlySet<string>;
  isKnownCode: (code: string) => boolean;
};

const TenantTablesContext = createContext<TenantTablesContextValue | null>(null);

export function TenantTablesProvider({
  tenant,
  tables,
  children,
}: {
  tenant: string;
  tables: TenantTableRow[];
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const codeSet = new Set(tables.map((t) => t.table_code));
    return {
      tenant: tenant.trim(),
      tables,
      hasRegistry: tables.length > 0,
      codeSet,
      isKnownCode: (code: string) => codeSet.has(code.trim()),
    };
  }, [tenant, tables]);

  return (
    <TenantTablesContext.Provider value={value}>{children}</TenantTablesContext.Provider>
  );
}

export function useTenantTables(): TenantTablesContextValue {
  const ctx = useContext(TenantTablesContext);
  if (!ctx) {
    return {
      tenant: "",
      tables: [],
      hasRegistry: false,
      codeSet: new Set(),
      isKnownCode: () => false,
    };
  }
  return ctx;
}
