"use client";

import { useCallback } from "react";

import { useTenantTableSelection } from "@/lib/cart/use-tenant-table-selection";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

/** `lang`·`table` 쿼리를 유지한 내부 링크 (`/t/{tenant}` 손님 내비). */
export function useConsumerNavHref(tenant: string) {
  const { locale } = useConsumerLocale();
  const { effectiveCode: table } = useTenantTableSelection(tenant);

  return useCallback(
    (path: string) => withConsumerLang(path, locale, table || undefined),
    [locale, table],
  );
}
