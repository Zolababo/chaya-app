"use client";

import { useCallback, useState } from "react";

type Props = {
  tenant: string;
  orderId: string;
  /** 스크린리더용 짧은 식별(예: id 앞 8자) */
  orderLabelShort: string;
};

/** 비회원 주문 목록 한 줄에서 상세 페이지 절대 URL 복사 */
export function GuestOrderRowCopyLinkButton({ tenant, orderId, orderLabelShort }: Props) {
  const [live, setLive] = useState<string | null>(null);

  const copy = useCallback(async () => {
    setLive(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const path = `/t/${encodeURIComponent(tenant)}/orders/${encodeURIComponent(orderId)}`;
    const url = `${origin}${path}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setLive("링크를 복사했습니다.");
        return;
      }
    } catch {
      /* fall through */
    }
    setLive("복사에 실패했습니다. 브라우저에서 주소를 직접 복사해 주세요.");
  }, [orderId, tenant]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={() => void copy()}
        className="min-h-[44px] min-w-[44px] px-2 text-xs font-semibold text-chaya-primary underline-offset-2 hover:underline dark:text-orange-400"
        aria-label={`주문 번호 앞 여덟 자리 ${orderLabelShort}, 상세 페이지 주소 복사`}
      >
        링크 복사
      </button>
      {live ? (
        <span role="status" aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
          {live}
        </span>
      ) : null}
    </div>
  );
}
