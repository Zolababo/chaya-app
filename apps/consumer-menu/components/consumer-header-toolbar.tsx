"use client";

import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { usePathname } from "next/navigation";

import { LocalePickerButton } from "@/components/locale-picker-button";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

const btnBase =
  "inline-flex min-h-[44px] max-w-[8rem] items-center justify-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-sm sm:min-h-[48px] sm:max-w-[8.5rem] sm:text-sm";

type Props = {
  tenant: string;
};

export function ConsumerHeaderToolbar({ tenant }: Props) {
  const { locale, m } = useConsumerLocale();
  const { enterEasyMode, exitEasyMode } = useConsumerEasyMode();
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
    ? `${btnBase} border-chaya-primary/50 bg-orange-50 text-chaya-primary dark:border-orange-500/60 dark:bg-orange-950/50 dark:text-orange-300`
    : `${btnBase} border-chaya-border bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`;

  const onToggleClick = () => {
    if (onBarrierFree) exitEasyMode();
    else enterEasyMode();
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label={m.header.toolbarLabel}>
      <LocalePickerButton />
      <Link
        href={menuHref}
        className={btnClass}
        aria-label={menuAria}
        aria-current={onBarrierFree ? "page" : undefined}
        onClick={onToggleClick}
      >
        <ListOrdered className="size-4 shrink-0 text-chaya-primary dark:text-orange-400" aria-hidden />
        <span className="truncate leading-tight">{menuLabel}</span>
      </Link>
    </div>
  );
}
