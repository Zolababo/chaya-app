"use client";

import { useFormStatus } from "react-dom";

import { ConsumerLoadingSpinner } from "@/components/consumer-loading-spinner";

type Props = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

/** 주문·테이블 결제 form submit — useFormStatus 스피너 */
export function MerchantOrderActionSubmit({
  label,
  pendingLabel = "처리 중…",
  className = "",
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={[
        "inline-flex items-center justify-center gap-2 transition disabled:cursor-wait disabled:opacity-80",
        className,
      ].join(" ")}
    >
      {pending ? (
        <>
          <ConsumerLoadingSpinner size="sm" />
          <span>{pendingLabel}</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}
