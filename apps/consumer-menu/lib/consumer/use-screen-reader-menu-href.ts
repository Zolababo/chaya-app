"use client";

import { useEffectiveScreenReaderMode } from "@/lib/consumer/use-effective-screen-reader-mode";
import { menuPathForScreenReaderMode } from "@/lib/consumer/screen-reader-routes";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";

export function useScreenReaderMenuHref(tenant: string): string {
  const { screenReaderMode } = useEffectiveScreenReaderMode(tenant);
  const navHref = useConsumerNavHref(tenant);
  return navHref(menuPathForScreenReaderMode(tenant, screenReaderMode));
}
