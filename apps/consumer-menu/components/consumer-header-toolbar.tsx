"use client";

import { useState } from "react";

import { BarrierFreeModeIcon } from "@/components/barrier-free-mode-icon";
import { ConsumerA11ySettingsSheet } from "@/components/consumer-a11y-settings-sheet";
import { ConsumerHeaderIconButton } from "@/components/consumer-header-icon-button";
import { LocalePickerButton } from "@/components/locale-picker-button";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

type Props = {
  tenant: string;
};

export function ConsumerHeaderToolbar({ tenant }: Props) {
  const { m } = useConsumerLocale();
  const { a11yActive } = useConsumerEasyMode();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-center gap-2" role="group" aria-label={m.header.toolbarLabel}>
        <LocalePickerButton />
        <ConsumerHeaderIconButton
          variant="a11y"
          active={a11yActive}
          aria-label={m.settings.openAria}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          title={m.settings.openAria}
          onClick={() => setSheetOpen(true)}
        >
          <BarrierFreeModeIcon className="size-7 shrink-0" />
        </ConsumerHeaderIconButton>
      </div>
      <ConsumerA11ySettingsSheet tenant={tenant} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
