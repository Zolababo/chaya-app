"use client";

import { useCallback, useState } from "react";
import { Copy, Share2 } from "lucide-react";

type RowProps = {
  label: string;
  url: string;
  shareTitle: string;
};

function OpsMerchantShareUrlRow({ label, url, shareTitle }: RowProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* ignore */
    }
  }, [url]);

  const onShare = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: shareTitle, url });
        return;
      }
      await onCopy();
    } catch {
      /* 사용자 취소 */
    }
  }, [onCopy, shareTitle, url]);

  const iconBtn =
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ops-border bg-ops-surface-2 text-ops-muted transition hover:bg-ops-surface-3 hover:text-ops-text";

  return (
    <div className="flex items-center gap-1.5">
      <span className="min-w-[5.5rem] shrink-0 text-[11px] font-semibold text-ops-subtle">{label}</span>
      <button
        type="button"
        onClick={() => void onCopy()}
        className={iconBtn}
        aria-label={`${label} 링크 ${copied ? "복사됨" : "복사"}`}
        title={copied ? "복사됨" : "복사"}
      >
        <Copy className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => void onShare()}
        className={iconBtn}
        aria-label={`${label} 공유`}
        title="공유"
      >
        <Share2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      </button>
      {copied ? (
        <span className="text-[10px] font-semibold text-[#22D3A0]" aria-live="polite">
          복사됨
        </span>
      ) : null}
    </div>
  );
}

type Props = {
  tenantSlug: string;
  loginUrl: string;
  dashboardUrl: string;
};

/** ops 점주 멤버십 — 매장별 로그인·대시보드 URL 복사/공유 */
export function OpsMerchantShareUrls({ tenantSlug, loginUrl, dashboardUrl }: Props) {
  return (
    <div className="space-y-1.5">
      <OpsMerchantShareUrlRow
        label="로그인 (공유)"
        url={loginUrl}
        shareTitle={`CHAYA 점주 로그인 — ${tenantSlug}`}
      />
      <OpsMerchantShareUrlRow
        label="대시보드"
        url={dashboardUrl}
        shareTitle={`CHAYA 점주 — ${tenantSlug}`}
      />
    </div>
  );
}
