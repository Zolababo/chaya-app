"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Copy, Download, Printer } from "lucide-react";

import { merchantSaveBtnClass, merchantSecondaryBtnClass, merchantSubCardClass } from "@/lib/merchant/merchant-more-sub-styles";
import { merchantTableQrImagePath } from "@/lib/tables/consumer-table-url";

type Props = {
  tenant: string;
  tableCode: string;
  consumerUrl: string;
  compact?: boolean;
};

export function MerchantTableQrCard({ tenant, tableCode, consumerUrl, compact = false }: Props) {
  const [live, setLive] = useState<string | null>(null);
  const qrSrc = merchantTableQrImagePath(tenant, tableCode);
  const printHref = `/m/${encodeURIComponent(tenant)}/tables/print?only=${encodeURIComponent(tableCode)}`;
  const imgSize = compact ? 120 : 160;

  const copy = useCallback(async (text: string, okMsg: string) => {
    setLive(null);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setLive(okMsg);
        return;
      }
    } catch {
      /* fall through */
    }
    setLive("복사에 실패했습니다.");
  }, []);

  return (
    <div id={`table-${tableCode}`} className={merchantSubCardClass}>
      <div className="px-4 pt-3.5 pb-2 text-center">
        <p className="text-lg font-black tabular-nums text-[#0F1117] dark:text-zinc-50">테이블 {tableCode}</p>
        <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">스캔 → 이 테이블로 주문</p>
      </div>
      <div className="flex justify-center pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          width={imgSize}
          height={imgSize}
          alt={`테이블 ${tableCode} QR`}
          className="rounded-lg bg-white ring-1 ring-[#E5E7EB]"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-[#F3F4F6] p-3 dark:border-zinc-800">
        <Link
          href={printHref}
          target="_blank"
          rel="noreferrer"
          className={`${merchantSaveBtnClass} min-h-[44px] gap-1.5 text-sm`}
        >
          <Printer className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          인쇄
        </Link>
        <a
          href={qrSrc}
          download={`table-${tableCode}-qr.png`}
          className={`${merchantSecondaryBtnClass} min-h-[44px] gap-1.5 text-sm`}
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          저장
        </a>
        <button
          type="button"
          onClick={() => void copy(consumerUrl, "주소를 복사했습니다.")}
          className="col-span-2 flex min-h-[40px] items-center justify-center gap-1.5 text-xs font-bold text-[#4B5563] underline-offset-2 hover:underline"
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          손님 주소 복사
        </button>
      </div>
      {live ? (
        <p className="border-t border-[#F3F4F6] px-3 py-2 text-center text-[11px] font-semibold text-[#00A85A] dark:border-zinc-800">
          {live}
        </p>
      ) : null}
    </div>
  );
}
