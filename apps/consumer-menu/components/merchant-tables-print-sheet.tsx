"use client";

import { merchantTableQrImagePath } from "@/lib/tables/consumer-table-url";
import {
  merchantTablePrintQrCm,
  merchantTablePrintStoreNamePt,
  merchantTablePrintTableNumberPt,
  type MerchantTablePrintDimensions,
} from "@/lib/merchant/merchant-table-qr-batch";
import type { TenantTableRow } from "@/lib/tables/types";

type Props = {
  tenant: string;
  storeName: string;
  tables: TenantTableRow[];
  consumerUrlsByCode: Record<string, string>;
  showTableLabel: boolean;
  dimensions: MerchantTablePrintDimensions;
};

export function MerchantTablesPrintSheet({
  tenant,
  storeName,
  tables,
  consumerUrlsByCode,
  showTableLabel,
  dimensions,
}: Props) {
  const qrCm = merchantTablePrintQrCm(dimensions, showTableLabel);
  const tableNumPt = merchantTablePrintTableNumberPt(dimensions);
  const storeNamePt = merchantTablePrintStoreNamePt(dimensions);
  const cardStyle = {
    width: `${dimensions.widthCm}cm`,
    height: `${dimensions.heightCm}cm`,
    padding: "0.35cm",
  } as const;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-[48px] rounded-full bg-chaya-primary px-8 text-base font-bold text-chaya-on-primary shadow-lg"
        >
          인쇄 (또는 PDF로 저장)
        </button>
      </div>

      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4 px-4 pb-24 pt-2 print:gap-[0.4cm] print:pb-0 print:pt-0">
        {tables.map((row) => {
          const url = consumerUrlsByCode[row.table_code] ?? "";
          const qrSrc = merchantTableQrImagePath(tenant, row.table_code);
          return (
            <article
              key={row.id}
              style={cardStyle}
              className="box-border flex flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-200 text-center print:break-inside-avoid print:rounded-none print:border-zinc-400"
            >
              <p
                className="max-w-full truncate font-semibold leading-tight text-zinc-500"
                style={{ fontSize: `${storeNamePt}pt` }}
              >
                {storeName}
              </p>

              {showTableLabel ? (
                <div className="mt-[0.15cm] shrink-0">
                  <p
                    className="font-black tabular-nums leading-none text-zinc-900"
                    style={{ fontSize: `${tableNumPt}pt` }}
                  >
                    {row.table_code}
                  </p>
                  <p className="mt-[0.05cm] font-bold text-zinc-600" style={{ fontSize: `${Math.max(7, tableNumPt * 0.38)}pt` }}>
                    테이블
                  </p>
                  {row.label ? (
                    <p
                      className="mt-[0.05cm] truncate text-zinc-500"
                      style={{ fontSize: `${Math.max(6, tableNumPt * 0.32)}pt` }}
                    >
                      {row.label}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt={`테이블 ${row.table_code} QR`}
                width={Math.round(qrCm * 37.8)}
                height={Math.round(qrCm * 37.8)}
                className="mt-auto shrink-0 object-contain"
                style={{
                  width: `${qrCm}cm`,
                  height: `${qrCm}cm`,
                }}
              />
              <p className="mt-[0.1cm] hidden max-w-full break-all font-mono leading-tight text-zinc-400 print:block" style={{ fontSize: "5pt" }}>
                {url}
              </p>
            </article>
          );
        })}
      </div>
    </>
  );
}
