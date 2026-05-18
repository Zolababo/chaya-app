"use client";

import Link from "next/link";
import { ListOrdered } from "lucide-react";

import { LocalePickerButton } from "@/components/locale-picker-button";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

const btnClass =
  "inline-flex min-h-[40px] max-w-[7.25rem] items-center justify-center gap-1 rounded-lg border border-chaya-border bg-white px-2 py-1 text-[11px] font-semibold text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

type Props = {
  tenant: string;
};

export function ConsumerHeaderToolbar({ tenant }: Props) {
  const { locale, m } = useConsumerLocale();
  const easyHref = withConsumerLang(`/t/${encodeURIComponent(tenant)}/barrier-free`, locale);

  return (
    <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label={m.header.toolbarLabel}>
      <LocalePickerButton />
      <Link href={easyHref} className={btnClass} aria-label={m.header.easyMenuAria}>
        <ListOrdered className="size-3.5 shrink-0 text-chaya-primary dark:text-orange-400" aria-hidden />
        <span className="truncate leading-tight">{m.header.easyMenu}</span>
      </Link>
    </div>
  );
}
