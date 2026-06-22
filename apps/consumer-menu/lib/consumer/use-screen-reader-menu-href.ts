"use client";

import { useConsumerScreenReaderMode } from "@/lib/consumer/consumer-screen-reader-mode-context";
import { menuPathForScreenReaderMode } from "@/lib/consumer/screen-reader-routes";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";

export function useScreenReaderMenuHref(tenant: string): string {
  const { screenReaderMode } = useConsumerScreenReaderMode();
  const navHref = useConsumerNavHref(tenant);
  return navHref(menuPathForScreenReaderMode(tenant, screenReaderMode));
}
