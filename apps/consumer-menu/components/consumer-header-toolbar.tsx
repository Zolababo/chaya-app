"use client";

import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { usePathname } from "next/navigation";

import { LocalePickerButton } from "@/components/locale-picker-button";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

const btnBase =
  "inline-flex min-h-[40px] max-w-[7.25rem] items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold shadow-sm";

type Props = {
  tenant: string;
};

export function ConsumerHeaderToolbar({ tenant }: Props) {
  const { locale, m } = useConsumerLocale();
  const pathname = usePathname();
  const slug = encodeURIComponent(tenant);
  const onBarrierFree = pathname.includes("/barrier-free");
  const menuHref = withConsumerLang(
    onBarrierFree ? `/t/${slug}` : `/t/${slug}/barrier-free`,
    locale,
  );
  const menuLabel = onBarrierFree ? m.barrierFree.toGridMenu : m.header.easyMenu;
  const menuAria = onBarrierFree ? m.barrierFree.toGridAria : m.header.easyMenuAria;
  const btnClass = onBarrierFree
    ? `${btnBase} border-chaya-primary/40 bg-orange-50 text-chaya-primary dark:border-orange-500/50 dark:bg-orange-950/40 dark:text-orange-300`
    : `${btnBase} border-chaya-border bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`;

  return (
    <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label={m.header.toolbarLabel}>
      <LocalePickerButton />
      <Link href={menuHref} className={btnClass} aria-label={menuAria} aria-current={onBarrierFree ? "page" : undefined}>
        <ListOrdered className="size-3.5 shrink-0 text-chaya-primary dark:text-orange-400" aria-hidden />
        <span className="truncate leading-tight">{menuLabel}</span>
      </Link>
    </div>
  );
}
