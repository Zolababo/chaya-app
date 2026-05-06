"use client";

import { useFormStatus } from "react-dom";

type Props = {
  confirmMessage: string;
};

export function MerchantOrderStatusSubmit({ confirmMessage }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      onClick={(e) => {
        if (pending) return;
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending ? "저장 중…" : "저장"}
    </button>
  );
}
