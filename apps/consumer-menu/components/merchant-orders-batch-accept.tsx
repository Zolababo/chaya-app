"use client";

import { useState } from "react";

import { batchAcceptPendingOrdersFromForm } from "@/app/m/[tenant]/orders/actions";

type Props = {
  tenant: string;
  pendingCount: number;
};

export function MerchantOrdersBatchAccept({ tenant, pendingCount }: Props) {
  const [open, setOpen] = useState(false);

  if (pendingCount <= 0) return null;

  if (!open) {
    return (
      <div className="mb-3">
        <button
          type="button"
          className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-chaya-primary/40 bg-chaya-primary/8 px-4 text-sm font-bold text-chaya-primary hover:bg-chaya-primary/15 dark:border-orange-700/50 dark:bg-orange-950/30 dark:text-orange-300"
          onClick={() => setOpen(true)}
        >
          {pendingCount}건 전체 접수
        </button>
      </div>
    );
  }

  return (
    <form
      action={batchAcceptPendingOrdersFromForm}
      className="mb-3 rounded-xl border border-chaya-primary/30 bg-chaya-primary/5 p-3 dark:border-orange-800/50 dark:bg-orange-950/25"
    >
      <input type="hidden" name="tenant_slug" value={tenant} />
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        대기 중인 주문 <span className="text-chaya-primary dark:text-orange-400">{pendingCount}건</span>을
        모두 접수할까요?
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        접수하면 조리 탭으로 이동합니다.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-chaya-primary px-4 text-sm font-bold text-white hover:opacity-95 dark:bg-orange-600"
        >
          {pendingCount}건 접수
        </button>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          onClick={() => setOpen(false)}
        >
          닫기
        </button>
      </div>
    </form>
  );
}
