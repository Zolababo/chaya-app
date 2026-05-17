"use client";

import { CONSUMER_CHECKOUT_PAYMENT_UI_VISIBLE } from "@/lib/consumer/future-features";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

type Props = {
  className?: string;
};

/** 온라인 결제 UI가 꺼져 있을 때만: 카운터 오프라인 결제 안내. */
export function ConsumerOfflinePaymentCallout({ className = "" }: Props) {
  const { m } = useConsumerLocale();

  if (CONSUMER_CHECKOUT_PAYMENT_UI_VISIBLE) return null;

  return (
    <p
      className={`rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100 ${className}`.trim()}
      role="note"
    >
      <strong className="font-semibold">{m.payment.offlineLead}</strong>
      {m.payment.offlineRest}
    </p>
  );
}
