"use client";

import Link from "next/link";

import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { useEasyMenuHref } from "@/lib/consumer/use-easy-menu-href";

type Props = {
  tenant: string;
};

export function MenuItemBackLink({ tenant }: Props) {
  const { m } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();
  const href = useEasyMenuHref(tenant);
  const labelClass = easyMode
    ? "mb-3 inline-flex min-h-[48px] items-center text-base font-bold text-chaya-primary dark:text-orange-400"
    : "mb-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-chaya-primary dark:text-orange-400";

  return (
    <Link href={href} className={labelClass} aria-label={m.menu.detailBack}>
      ← {easyMode ? m.barrierFree.pageTitle : m.nav.menu}
    </Link>
  );
}
