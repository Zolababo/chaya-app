"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { TenantTableRow } from "@/lib/tables/types";

type TenantTablesContextValue = {
  tenant: string;
  tables: TenantTableRow[];
  hasRegistry: boolean;
  codeSet: ReadonlySet<string>;
  isKnownCode: (code: string) => boolean;
};

const TenantTablesContext = createContext<TenantTablesContextValue | null>(null);

export function TenantTablesProvider({
  tenant,
  tables: initialTables,
  deferLoad = false,
  children,
}: {
  tenant: string;
  tables: TenantTableRow[];
  /** true면 마운트 후 `/t/{tenant}/tables/active` 로 채움 — 메뉴 첫 paint 가속 */
  deferLoad?: boolean;
  children: ReactNode;
}) {
  const [tables, setTables] = useState(initialTables);
  const slug = tenant.trim();

  useEffect(() => {
    if (!deferLoad || initialTables.length > 0 || !slug) return;

    let cancelled = false;
    void fetch(`/t/${encodeURIComponent(slug)}/tables/active`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { tables?: TenantTableRow[] } | null) => {
        if (cancelled || !body || !Array.isArray(body.tables)) return;
        setTables(body.tables);
      })
      .catch(() => {
        /* 테이블 없음·오류 — 레거시 자유 입력 */
      });

    return () => {
      cancelled = true;
    };
  }, [deferLoad, initialTables.length, slug]);

  const value = useMemo(() => {
    const codeSet = new Set(tables.map((t) => t.table_code));
    return {
      tenant: slug,
      tables,
      hasRegistry: tables.length > 0,
      codeSet,
      isKnownCode: (code: string) => codeSet.has(code.trim()),
    };
  }, [slug, tables]);

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
