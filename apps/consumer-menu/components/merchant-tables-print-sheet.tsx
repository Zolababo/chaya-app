"use client";

import { buildConsumerTableUrl, merchantTableQrImagePath } from "@/lib/tables/consumer-table-url";
import type { TenantTableRow } from "@/lib/tables/types";

type Props = {
  tenant: string;
  tables: TenantTableRow[];
  siteBase: string | null;
};

export function MerchantTablesPrintSheet({ tenant, tables, siteBase }: Props) {
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

      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 pb-24 pt-2 sm:grid-cols-3 print:grid-cols-3 print:gap-4 print:pb-0 print:pt-0">
        {tables.map((row) => {
          const url = buildConsumerTableUrl(tenant, row.table_code, siteBase);
          const qrSrc = merchantTableQrImagePath(tenant, row.table_code);
          return (
            <article
              key={row.id}
              className="flex flex-col items-center rounded-xl border border-zinc-200 p-4 text-center print:break-inside-avoid print:border-zinc-300"
            >
              <p className="text-2xl font-bold tabular-nums">테이블 {row.table_code}</p>
              {row.label ? <p className="mt-0.5 text-sm text-zinc-600">{row.label}</p> : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt={`테이블 ${row.table_code} QR`}
                width={200}
                height={200}
                className="mt-3 size-[200px] print:size-[180px]"
              />
              <p className="mt-2 max-w-full break-all font-mono text-[9px] leading-tight text-zinc-500">
                {url}
              </p>
            </article>
          );
        })}
      </div>

    </>
  );
}
