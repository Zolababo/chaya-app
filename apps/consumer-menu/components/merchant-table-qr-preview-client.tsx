"use client";

import Image from "next/image";
import { useState } from "react";
import { Download, Share2 } from "lucide-react";

type Props = {
  tenant: string;
  tableCode: string;
  consumerUrl: string;
  qrImagePath: string;
};

export function MerchantTableQrPreviewClient({
  tableCode,
  consumerUrl,
  qrImagePath,
}: Props) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `테이블 ${tableCode}`,
          text: `테이블 ${tableCode} 메뉴`,
          url: consumerUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(consumerUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 사용자 취소 */
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-medium text-[#9CA3AF]">
        QR을 테이블에 붙여 손님이 주문할 수 있게 해요
      </p>
      <div className="flex flex-col items-center gap-3 rounded-[14px] border border-[#E5E7EB] bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-lg font-black text-[#111827] dark:text-zinc-50">테이블 {tableCode}</p>
        <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F2F3F5] dark:border-zinc-700 dark:bg-zinc-900">
          <Image
            src={qrImagePath}
            alt={`테이블 ${tableCode} QR`}
            fill
            unoptimized
            className="object-contain p-2"
          />
        </div>
        <div className="flex w-full gap-2">
          <a
            href={qrImagePath}
            download={`table-${tableCode}-qr.png`}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-[#E5E7EB] bg-[#F2F3F5] text-sm font-bold text-[#4B5563] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <Download className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            저장
          </a>
          <button
            type="button"
            onClick={() => void onShare()}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-chaya-primary text-sm font-bold text-white"
          >
            <Share2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            {copied ? "복사됨" : "공유"}
          </button>
        </div>
      </div>
    </div>
  );
}
