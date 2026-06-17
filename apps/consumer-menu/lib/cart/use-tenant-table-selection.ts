"use client";

import { useMemo } from "react";

import { useTenantTables } from "@/lib/consumer/tenant-tables-context";
import { normalizeTableCode } from "@/lib/tables/tenant-table-code";

import { useTenantTableNumber } from "./use-tenant-table";

export type TenantTableSelectionState = {
  /** 화면·주문에 쓸 번호 (검증 통과한 경우만). */
  effectiveCode: string;
  /** URL/저장값 원문. */
  rawCode: string;
  hasRegistry: boolean;
  /** 마스터가 있고 번호가 확정(잠금)된 경우. */
  isLocked: boolean;
  /** URL에 table 이 있으나 마스터에 없음. */
  invalidQuery: boolean;
  /** 마스터가 있는데 아직 번호 없음. */
  needsPick: boolean;
};

export function useTenantTableSelection(tenant: string): TenantTableSelectionState {
  const rawCode = useTenantTableNumber(tenant);
  const { hasRegistry, isKnownCode } = useTenantTables();

  return useMemo(() => {
    const trimmed = rawCode.trim();
    if (!hasRegistry) {
      const norm = trimmed ? normalizeTableCode(trimmed) : null;
      const effective = norm?.ok ? norm.code : trimmed.slice(0, 30);
      return {
        effectiveCode: effective,
        rawCode: trimmed,
        hasRegistry: false,
        isLocked: false,
        invalidQuery: false,
        needsPick: false,
      };
    }

    if (!trimmed) {
      return {
        effectiveCode: "",
        rawCode: "",
        hasRegistry: true,
        isLocked: false,
        invalidQuery: false,
        needsPick: true,
      };
    }

    const norm = normalizeTableCode(trimmed);
    if (!norm.ok || !isKnownCode(norm.code)) {
      return {
        effectiveCode: "",
        rawCode: trimmed,
        hasRegistry: true,
        isLocked: false,
        invalidQuery: true,
        needsPick: true,
      };
    }

    return {
      effectiveCode: norm.code,
      rawCode: trimmed,
      hasRegistry: true,
      isLocked: true,
      invalidQuery: false,
      needsPick: false,
    };
  }, [rawCode, hasRegistry, isKnownCode]);
}
