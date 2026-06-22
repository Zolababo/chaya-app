"use client";

import { BarrierFreeModeIcon } from "@/components/barrier-free-mode-icon";
import { ConsumerHeaderIconButton } from "@/components/consumer-header-icon-button";
import { LocalePickerButton } from "@/components/locale-picker-button";
import { useConsumerScreenReaderMode } from "@/lib/consumer/consumer-screen-reader-mode-context";
import {
  isMenuHomePath,
  isScreenReaderMenuPath,
  menuPathForScreenReaderMode,
} from "@/lib/consumer/screen-reader-routes";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  tenant: string;
};

export function ConsumerHeaderToolbar({ tenant }: Props) {
  const { m } = useConsumerLocale();
  const { screenReaderMode, setScreenReaderMode } = useConsumerScreenReaderMode();
  const pathname = usePathname();
  const router = useRouter();
  const navHref = useConsumerNavHref(tenant);

  const onLabel = m.settings.screenReaderOn;
  const offLabel = m.settings.screenReaderOff;
  const ariaLabel = screenReaderMode ? onLabel : offLabel;

  const handleToggle = () => {
    const next = !screenReaderMode;
    setScreenReaderMode(next);
    if (next && isMenuHomePath(pathname, tenant) && !isScreenReaderMenuPath(pathname)) {
      router.push(navHref(menuPathForScreenReaderMode(tenant, true)));
    } else if (!next && isScreenReaderMenuPath(pathname)) {
      router.push(navHref(menuPathForScreenReaderMode(tenant, false)));
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-2" role="group" aria-label={m.header.toolbarLabel}>
      <LocalePickerButton />
      <ConsumerHeaderIconButton
        variant="a11y"
        active={screenReaderMode}
        aria-label={ariaLabel}
        aria-pressed={screenReaderMode}
        title={ariaLabel}
        onClick={handleToggle}
      >
        <BarrierFreeModeIcon className="size-7 shrink-0" />
      </ConsumerHeaderIconButton>
    </div>
  );
}
