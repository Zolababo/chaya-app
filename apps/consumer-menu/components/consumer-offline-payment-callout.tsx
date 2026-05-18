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

  const text = [m.payment.offlineLead, m.payment.offlineRest].filter(Boolean).join(" ");
  if (!text) return null;

  return (
    <p
      className={`text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 ${className}`.trim()}
      role="note"
    >
      {text}
    </p>
  );
}
