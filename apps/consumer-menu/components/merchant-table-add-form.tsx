"use client";

import { Loader2, Plus } from "lucide-react";
import { useFormStatus } from "react-dom";

import { addTenantTableAction } from "@/app/m/[tenant]/tables/actions";
import { merchantFieldInputClass } from "@/lib/merchant/merchant-more-sub-styles";

type Props = {
  tenant: string;
};

function AddTableSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex min-w-[5.5rem] shrink-0 items-center justify-center gap-1 rounded-[10px] bg-chaya-primary px-4 text-sm font-extrabold text-white disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden />
      ) : (
        <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      )}
      {pending ? "추가 중…" : "추가"}
    </button>
  );
}

function AddTableFields({ tenant }: { tenant: string }) {
  const { pending } = useFormStatus();

  return (
    <>
      <input type="hidden" name="tenant_slug" value={tenant} />
      <input
        name="table_code"
        required
        disabled={pending}
        inputMode="numeric"
        pattern="[0-9]{1,3}"
        placeholder="예: 01"
        maxLength={3}
        className={`${merchantFieldInputClass} min-w-0 flex-1 bg-white px-2 text-center text-xl font-extrabold tabular-nums placeholder:text-base placeholder:font-semibold placeholder:tracking-normal placeholder:text-[#9CA3AF] disabled:opacity-60 dark:bg-zinc-950`}
      />
      <AddTableSubmitButton />
    </>
  );
}

export function MerchantTableAddForm({ tenant }: Props) {
  return (
    <>
      <div className="relative flex gap-2 border-t border-[#F3F4F6] bg-[#F2F3F5] px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <form action={addTenantTableAction} className="flex w-full gap-2">
          <AddTableFields tenant={tenant} />
        </form>
      </div>
      <p className="bg-[#F2F3F5] px-4 pb-3 text-xs font-medium text-[#9CA3AF] dark:bg-zinc-900/50">
        1~99는 01·02처럼 저장 (100 이상은 100, 101…)
      </p>
    </>
  );
}
