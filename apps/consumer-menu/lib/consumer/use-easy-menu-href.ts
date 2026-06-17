"use client";

import { useTenantTableSelection } from "@/lib/cart/use-tenant-table-selection";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

/** 큰글씨 모드면 목록형 메뉴(`/barrier-free`), 아니면 기본 메뉴판 */
export function useEasyMenuHref(tenant: string): string {
  const { locale } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();
  const { effectiveCode: table } = useTenantTableSelection(tenant);
  const slug = encodeURIComponent(tenant.trim());
  const path = easyMode ? `/t/${slug}/barrier-free` : `/t/${slug}`;
  return withConsumerLang(path, locale, table || undefined);
}
