"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function OrdersListError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[orders]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 text-center" role="alert" aria-live="assertive">
      <h1 className="text-xl font-bold">주문 목록을 불러오지 못했습니다</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">네트워크나 Supabase 연결을 확인한 뒤 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="min-h-[48px] rounded-xl bg-chaya-primary px-6 py-3 font-semibold text-chaya-on-primary"
      >
        다시 시도
      </button>
    </div>
  );
}
