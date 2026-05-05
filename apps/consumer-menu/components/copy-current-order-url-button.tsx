"use client";

import { useCallback, useState } from "react";

/** 주문 접수 화면에서 매장·고객 안내용으로 현재 탭 URL을 복사합니다. */
export function CopyCurrentOrderUrlButton() {
  const [live, setLive] = useState<string | null>(null);

  const copy = useCallback(async () => {
    setLive(null);
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) {
      setLive("주소를 불러오지 못했습니다.");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setLive("주문 페이지 주소를 복사했습니다.");
        return;
      }
    } catch {
      /* fall through */
    }
    setLive("이 브라우저에서는 복사를 쓸 수 없습니다. 주소 표시줄에서 직접 복사해 주세요.");
  }, []);

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => void copy()}
        className="min-h-[48px] rounded-xl border border-chaya-border px-4 py-3 text-sm font-semibold text-chaya-primary dark:border-zinc-700"
        aria-label="지금 보이는 주문 페이지 주소를 클립보드에 복사"
      >
        이 주문 주소 복사
      </button>
      {live ? (
        <p role="status" aria-live="polite" className="max-w-md text-center text-sm text-zinc-600 dark:text-zinc-400">
          {live}
        </p>
      ) : null}
    </div>
  );
}
