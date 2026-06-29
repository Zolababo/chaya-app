"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { bulkAddTenantTablesAction } from "@/app/m/[tenant]/tables/actions";
import { merchantFieldInputClass } from "@/lib/merchant/merchant-more-sub-styles";

type Props = {
  tenant: string;
};

function BulkSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] shrink-0 rounded-[10px] bg-chaya-primary px-4 text-sm font-extrabold text-white disabled:opacity-70"
    >
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          추가 중…
        </span>
      ) : (
        "범위 추가"
      )}
    </button>
  );
}

/** 테이블 번호 범위(예: 1~12)를 한 번에 등록 */
export function MerchantTableBulkAddForm({ tenant }: Props) {
  return (
    <details className="border-t border-[#F3F4F6] bg-[#F2F3F5] px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <summary className="cursor-pointer text-xs font-bold text-[#4B5563] dark:text-zinc-400">
        번호 범위로 한번에 추가 (최대 50개)
      </summary>
      <form action={bulkAddTenantTablesAction} className="mt-3 space-y-2">
        <input type="hidden" name="tenant_slug" value={tenant} />
        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[11px] font-bold text-[#9CA3AF]">시작</span>
            <input
              name="from_no"
              type="number"
              min={1}
              max={999}
              defaultValue={1}
              required
              className={`${merchantFieldInputClass} text-center text-lg font-extrabold tabular-nums`}
            />
          </label>
          <span className="pb-3 text-sm font-bold text-[#9CA3AF]">~</span>
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[11px] font-bold text-[#9CA3AF]">끝</span>
            <input
              name="to_no"
              type="number"
              min={1}
              max={999}
              defaultValue={12}
              required
              className={`${merchantFieldInputClass} text-center text-lg font-extrabold tabular-nums`}
            />
          </label>
          <BulkSubmit />
        </div>
        <p className="text-[11px] font-medium text-[#9CA3AF]">
          예: 1~12 → 01·02… 테이블이 한 번에 만들어지고, 아래에서 QR을 묶어 인쇄할 수 있어요.
        </p>
      </form>
    </details>
  );
}
