"use client";

import Link from "next/link";

import { useConsumerScreenReaderMode } from "@/lib/consumer/consumer-screen-reader-mode-context";
import { useScreenReaderMenuHref } from "@/lib/consumer/use-screen-reader-menu-href";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

type Props = {
  tenant: string;
};

export function MenuItemBackLink({ tenant }: Props) {
  const { m } = useConsumerLocale();
  const { screenReaderMode } = useConsumerScreenReaderMode();
  const href = useScreenReaderMenuHref(tenant);
  const labelClass = screenReaderMode
    ? "mb-3 inline-flex min-h-[48px] items-center text-base font-bold text-chaya-primary dark:text-orange-400"
    : "mb-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-chaya-primary dark:text-orange-400";

  return (
    <Link href={href} className={labelClass} aria-label={m.menu.detailBack}>
      ← {screenReaderMode ? m.barrierFree.pageTitle : m.nav.menu}
    </Link>
  );
}
