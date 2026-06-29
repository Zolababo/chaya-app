"use client";

import { Download, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  MERCHANT_TABLE_PRINT_DEFAULT_HEIGHT_CM,
  MERCHANT_TABLE_PRINT_DEFAULT_WIDTH_CM,
  MERCHANT_TABLE_PRINT_DIM_MAX_CM,
  MERCHANT_TABLE_PRINT_DIM_MIN_CM,
  clampMerchantTablePrintDimensions,
  merchantTablesExportHref,
  merchantTablesPrintHref,
  readMerchantTablePrintOptions,
  writeMerchantTablePrintOptions,
} from "@/lib/merchant/merchant-table-qr-batch";
import { merchantSecondaryBtnClass, merchantSubCardClass } from "@/lib/merchant/merchant-more-sub-styles";

type Props = {
  tenant: string;
  tableCodes: string[];
  selectedCodes: string[];
  onToggle: (code: string) => void;
  onToggleAll: (on: boolean) => void;
};

const dimInputClass =
  "w-full min-w-0 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-bold tabular-nums text-[#111827] outline-none focus:border-chaya-primary dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

function parseInputCm(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function MerchantTablesQrToolbar({
  tenant,
  tableCodes,
  selectedCodes,
  onToggle,
  onToggleAll,
}: Props) {
  const [showTableLabel, setShowTableLabel] = useState(true);
  const [widthCm, setWidthCm] = useState(String(MERCHANT_TABLE_PRINT_DEFAULT_WIDTH_CM));
  const [heightCm, setHeightCm] = useState(String(MERCHANT_TABLE_PRINT_DEFAULT_HEIGHT_CM));
  const allSelected = tableCodes.length > 0 && selectedCodes.length === tableCodes.length;
  const printTargets = selectedCodes.length > 0 ? selectedCodes : tableCodes;

  useEffect(() => {
    const opts = readMerchantTablePrintOptions();
    setShowTableLabel(opts.showTableLabel);
    setWidthCm(String(opts.widthCm));
    setHeightCm(String(opts.heightCm));
  }, []);

  const resolvedDims = useMemo(() => {
    const w = parseInputCm(widthCm) ?? MERCHANT_TABLE_PRINT_DEFAULT_WIDTH_CM;
    const h = parseInputCm(heightCm) ?? MERCHANT_TABLE_PRINT_DEFAULT_HEIGHT_CM;
    return clampMerchantTablePrintDimensions(w, h);
  }, [widthCm, heightCm]);

  const persist = (patch: Partial<{ showTableLabel: boolean; widthCm: string; heightCm: string }>) => {
    const nextW = patch.widthCm ?? widthCm;
    const nextH = patch.heightCm ?? heightCm;
    const w = parseInputCm(nextW) ?? MERCHANT_TABLE_PRINT_DEFAULT_WIDTH_CM;
    const h = parseInputCm(nextH) ?? MERCHANT_TABLE_PRINT_DEFAULT_HEIGHT_CM;
    const dims = clampMerchantTablePrintDimensions(w, h);
    const next = {
      showTableLabel: patch.showTableLabel ?? showTableLabel,
      widthCm: dims.widthCm,
      heightCm: dims.heightCm,
    };
    setShowTableLabel(next.showTableLabel);
    setWidthCm(String(dims.widthCm));
    setHeightCm(String(dims.heightCm));
    writeMerchantTablePrintOptions(next);
  };

  const commitDimension = (axis: "widthCm" | "heightCm", raw: string) => {
    persist({ [axis]: raw });
  };

  const printHref = useMemo(
    () =>
      merchantTablesPrintHref(tenant, printTargets, {
        showTableLabel,
        widthCm: resolvedDims.widthCm,
        heightCm: resolvedDims.heightCm,
      }),
    [tenant, printTargets, showTableLabel, resolvedDims.widthCm, resolvedDims.heightCm],
  );
  const exportHref = useMemo(
    () => merchantTablesExportHref(tenant, printTargets),
    [tenant, printTargets],
  );

  if (tableCodes.length === 0) return null;

  return (
    <section className={`${merchantSubCardClass} space-y-3 p-4`} aria-label="QR 일괄 작업">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-[#111827] dark:text-zinc-50">QR 인쇄·저장</p>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#4B5563]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onToggleAll(e.target.checked)}
            className="size-4 rounded border-[#D1D5DB]"
          />
          전체 선택 ({tableCodes.length})
        </label>
      </div>

      <ul className="flex flex-wrap gap-2">
        {tableCodes.map((code) => {
          const on = selectedCodes.includes(code);
          return (
            <li key={code}>
              <button
                type="button"
                onClick={() => onToggle(code)}
                className={[
                  "min-h-[36px] rounded-lg border px-3 text-sm font-bold tabular-nums transition",
                  on
                    ? "border-chaya-primary bg-chaya-primary/10 text-chaya-primary"
                    : "border-[#E5E7EB] bg-[#F2F3F5] text-[#4B5563] dark:border-zinc-700 dark:bg-zinc-900",
                ].join(" ")}
                aria-pressed={on}
              >
                {code}
              </button>
            </li>
          );
        })}
      </ul>

      <fieldset className="rounded-[10px] border border-[#E5E7EB] bg-[#F2F3F5] px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/60">
        <legend className="px-1 text-[11px] font-bold text-[#9CA3AF]">인쇄 옵션</legend>

        <div className="mt-1">
          <span className="mb-1.5 block text-[11px] font-bold text-[#9CA3AF]">가로 × 세로 (cm)</span>
          <div className="flex items-center gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">가로 cm</span>
              <input
                type="number"
                inputMode="decimal"
                min={MERCHANT_TABLE_PRINT_DIM_MIN_CM}
                max={MERCHANT_TABLE_PRINT_DIM_MAX_CM}
                step={0.1}
                value={widthCm}
                onChange={(e) => setWidthCm(e.target.value)}
                onBlur={(e) => commitDimension("widthCm", e.target.value)}
                className={dimInputClass}
                aria-label="가로 cm"
              />
            </label>
            <span className="shrink-0 text-sm font-bold text-[#9CA3AF]" aria-hidden>
              ×
            </span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">세로 cm</span>
              <input
                type="number"
                inputMode="decimal"
                min={MERCHANT_TABLE_PRINT_DIM_MIN_CM}
                max={MERCHANT_TABLE_PRINT_DIM_MAX_CM}
                step={0.1}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                onBlur={(e) => commitDimension("heightCm", e.target.value)}
                className={dimInputClass}
                aria-label="세로 cm"
              />
            </label>
          </div>
          <p className="mt-1 text-[10px] font-medium text-[#9CA3AF]">
            {MERCHANT_TABLE_PRINT_DIM_MIN_CM}~{MERCHANT_TABLE_PRINT_DIM_MAX_CM}cm · 인쇄 시 카드가 이 크기로 맞춰집니다
          </p>
        </div>

        <label className="mt-2.5 flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={showTableLabel}
            onChange={(e) => persist({ showTableLabel: e.target.checked })}
            className="mt-0.5 size-4 rounded border-[#D1D5DB]"
          />
          <span className="text-xs font-semibold leading-relaxed text-[#4B5563] dark:text-zinc-300">
            테이블 번호 함께 인쇄
            <span className="mt-0.5 block font-medium text-[#9CA3AF]">
              QR 위·아래에 번호가 함께 나옵니다. 끄면 QR만 인쇄됩니다.
            </span>
          </span>
        </label>
      </fieldset>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={printHref}
          target="_blank"
          rel="noreferrer"
          className={`${merchantSecondaryBtnClass} min-h-[48px] gap-1.5`}
        >
          <Printer className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          {selectedCodes.length > 0 ? `선택 ${selectedCodes.length}개 인쇄` : "전체 인쇄"}
        </a>
        <a
          href={exportHref}
          className={`${merchantSecondaryBtnClass} min-h-[48px] gap-1.5`}
        >
          <Download className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          {selectedCodes.length > 0 ? "선택 ZIP" : "QR 묶음 ZIP"}
        </a>
      </div>
    </section>
  );
}
