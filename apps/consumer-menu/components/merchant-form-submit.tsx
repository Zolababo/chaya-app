"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

export function MerchantFormSubmit({
  label,
  pendingLabel = "저장 중…",
  className = "rounded-lg bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary disabled:opacity-60",
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
