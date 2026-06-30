"use client";

import { CONSUMER_CHECKOUT_PAYMENT_UI_VISIBLE } from "@/lib/consumer/future-features";
import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

type Props = {
  className?: string;
  variant?: "subtle" | "prominent";
};

/** 온라인 결제 UI가 꺼져 있을 때만: 카운터 오프라인 결제 안내. */
export function ConsumerOfflinePaymentCallout({ className = "", variant = "subtle" }: Props) {
  const { m } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();

  if (CONSUMER_CHECKOUT_PAYMENT_UI_VISIBLE) return null;

  const lead = m.payment.offlineLead.trim();
  const rest = m.payment.offlineRest.trim();
  if (!lead && !rest) return null;

  if (variant === "prominent") {
    return (
      <div
        className={`flex items-start gap-2.5 rounded-xl border-l-[3px] border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/30 ${easyMode ? "px-4 py-4" : "px-3.5 py-3"} ${className}`.trim()}
        role="note"
      >
        <span className="text-base leading-none" aria-hidden>
          🧾
        </span>
        <p
          className={`font-semibold leading-relaxed text-amber-900 dark:text-amber-100 ${easyMode ? "text-base" : "text-xs"}`}
        >
          {lead}
          {rest ? (
            <>
              <br />
              <span className="font-medium text-amber-800/90 dark:text-amber-200/90">{rest}</span>
            </>
          ) : null}
        </p>
      </div>
    );
  }

  const text = [lead, rest].filter(Boolean).join(" ");
  return (
    <p
      className={`rounded-2xl border border-chaya-primary/15 bg-chaya-primary/5 text-center font-medium leading-relaxed text-zinc-700 dark:border-orange-900/40 dark:bg-orange-950/25 dark:text-zinc-300 ${easyMode ? "px-5 py-3.5 text-base" : "px-4 py-2.5 text-xs"} ${className}`.trim()}
      role="note"
    >
      {text}
    </p>
  );
}
