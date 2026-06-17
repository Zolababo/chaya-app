"use client";

import { useFormStatus } from "react-dom";

type Props = {
  label?: string;
  pendingLabel?: string;
};

export function MerchantTableDeleteSubmit({
  label = "삭제",
  pendingLabel = "삭제 중…",
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="min-h-[48px] w-full rounded-[10px] bg-[#DC2626] text-[15px] font-extrabold text-white disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
