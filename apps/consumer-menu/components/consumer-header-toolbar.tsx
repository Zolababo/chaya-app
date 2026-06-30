"use client";



import { useId, useState } from "react";



import { BarrierFreeModeIcon } from "@/components/barrier-free-mode-icon";

import { ConsumerHeaderIconButton } from "@/components/consumer-header-icon-button";

import { LocalePickerButton } from "@/components/locale-picker-button";

import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";



type Props = {

  tenant: string;

};



export function ConsumerHeaderToolbar({ tenant }: Props) {

  const { m } = useConsumerLocale();

  const { barrierFreeMode, toggleBarrierFreeMode } = useConsumerEasyMode();

  const statusId = useId();

  const [statusMessage, setStatusMessage] = useState("");



  const handleToggle = () => {

    const next = !barrierFreeMode;

    toggleBarrierFreeMode();

    setStatusMessage(next ? m.settings.screenReaderOn : m.settings.screenReaderOffDone);

  };



  return (

    <>

      <div className="flex shrink-0 items-center gap-2" role="group" aria-label={m.header.toolbarLabel}>

        <LocalePickerButton />

        <ConsumerHeaderIconButton

          variant="a11y"

          active={barrierFreeMode}

          aria-label={m.settings.openAria}

          aria-pressed={barrierFreeMode}

          aria-describedby={statusMessage ? statusId : undefined}

          title={barrierFreeMode ? m.settings.screenReaderOn : m.settings.screenReaderOff}

          onClick={handleToggle}

        >

          <BarrierFreeModeIcon className="size-7 shrink-0" />

        </ConsumerHeaderIconButton>

      </div>

      <p id={statusId} role="status" aria-live="polite" className="sr-only">

        {statusMessage}

      </p>

    </>

  );

}


