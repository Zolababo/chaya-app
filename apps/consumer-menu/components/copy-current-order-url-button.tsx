"use client";

import { useCallback, useEffect, useState } from "react";

/** 주문 접수 화면: 현재 탭 URL 복사 · (지원 시) OS 공유 시트로 링크 전달 */
export function CopyCurrentOrderUrlButton() {
  const [live, setLive] = useState<string | null>(null);
  const [supportsShare, setSupportsShare] = useState(false);

  useEffect(() => {
    setSupportsShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const copy = useCallback(async () => {
    setLive(null);
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
  }, [url]);

  const share = useCallback(async () => {
    setLive(null);
    if (!url) {
      setLive("주소를 불러오지 못했습니다.");
      return;
    }
    if (typeof navigator.share !== "function") {
      setLive("이 기기에서는 시스템 공유를 쓸 수 없습니다.");
      return;
    }
    try {
      await navigator.share({
        title: "주문 확인",
        text: "주문 페이지 링크입니다.",
        url,
      });
      setLive("공유했습니다.");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      setLive("공유를 완료하지 못했습니다.");
    }
  }, [url]);

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <button
          type="button"
          onClick={() => void copy()}
          className="min-h-[48px] flex-1 rounded-xl border border-chaya-border px-4 py-3 text-sm font-semibold text-chaya-primary dark:border-zinc-700 sm:min-w-[10rem]"
          aria-label="지금 보이는 주문 페이지 주소를 클립보드에 복사"
        >
          이 주문 주소 복사
        </button>
        {supportsShare ? (
          <button
            type="button"
            onClick={() => void share()}
            className="min-h-[48px] flex-1 rounded-xl border border-chaya-border px-4 py-3 text-sm font-semibold text-chaya-primary dark:border-zinc-700 sm:min-w-[10rem]"
            aria-label="카카오톡 등 다른 앱으로 주문 페이지 링크 공유"
          >
            다른 앱으로 공유
          </button>
        ) : null}
      </div>
      {live ? (
        <p role="status" aria-live="polite" className="max-w-md text-center text-sm text-zinc-600 dark:text-zinc-400">
          {live}
        </p>
      ) : null}
    </div>
  );
}
