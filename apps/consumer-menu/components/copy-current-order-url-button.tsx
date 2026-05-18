"use client";

import { useCallback, useEffect, useState } from "react";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

/** 주문 접수 화면: 현재 탭 URL 복사 · (지원 시) OS 공유 시트로 링크 전달 */
export function CopyCurrentOrderUrlButton() {
  const { m } = useConsumerLocale();
  const [live, setLive] = useState<string | null>(null);
  const [supportsShare, setSupportsShare] = useState(false);

  useEffect(() => {
    setSupportsShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const copy = useCallback(async () => {
    setLive(null);
    if (!url) {
      setLive(m.copyOrder.noUrl);
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setLive(m.copyOrder.copied);
        return;
      }
    } catch {
      /* fall through */
    }
    setLive(m.copyOrder.copyUnsupported);
  }, [url, m.copyOrder]);

  const share = useCallback(async () => {
    setLive(null);
    if (!url) {
      setLive(m.copyOrder.noUrl);
      return;
    }
    if (typeof navigator.share !== "function") {
      setLive(m.copyOrder.shareUnsupported);
      return;
    }
    try {
      await navigator.share({
        title: m.copyOrder.shareTitle,
        text: m.copyOrder.shareText,
        url,
      });
      setLive(m.copyOrder.shared);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      setLive(m.copyOrder.shareFailed);
    }
  }, [url, m.copyOrder]);

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <button
          type="button"
          onClick={() => void copy()}
          className="min-h-[48px] flex-1 rounded-xl border border-chaya-border px-4 py-3 text-sm font-semibold text-chaya-primary dark:border-zinc-700 sm:min-w-[10rem]"
          aria-label={m.copyOrder.copyAria}
        >
          {m.copyOrder.copy}
        </button>
        {supportsShare ? (
          <button
            type="button"
            onClick={() => void share()}
            className="min-h-[48px] flex-1 rounded-xl border border-chaya-border px-4 py-3 text-sm font-semibold text-chaya-primary dark:border-zinc-700 sm:min-w-[10rem]"
            aria-label={m.copyOrder.shareAria}
          >
            {m.copyOrder.share}
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
