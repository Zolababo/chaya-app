"use client";

import { useTenantTableSelection } from "@/lib/cart/use-tenant-table-selection";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { menuPathForEasyMode } from "@/lib/consumer/easy-mode-routes";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

/** 베리어프리 모드면 목록형 메뉴(`/barrier-free`), 아니면 기본 메뉴판 */
export function useScreenReaderMenuHref(tenant: string): string {
  const { locale } = useConsumerLocale();
  const { barrierFreeMode } = useConsumerEasyMode();
  const { effectiveCode: table } = useTenantTableSelection(tenant);
  const path = menuPathForEasyMode(tenant, barrierFreeMode);
  return withConsumerLang(path, locale, table || undefined);
}
