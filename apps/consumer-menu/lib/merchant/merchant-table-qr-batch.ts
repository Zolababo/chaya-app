/** 테이블 QR 일괄 인쇄·다운로드 URL 및 출력 크기(cm) */

export const MERCHANT_TABLE_PRINT_DIM_MIN_CM = 3;
export const MERCHANT_TABLE_PRINT_DIM_MAX_CM = 25;
export const MERCHANT_TABLE_PRINT_DEFAULT_WIDTH_CM = 6;
export const MERCHANT_TABLE_PRINT_DEFAULT_HEIGHT_CM = 8;

export type MerchantTablePrintDimensions = {
  widthCm: number;
  heightCm: number;
};

export type MerchantTablePrintOptions = MerchantTablePrintDimensions & {
  showTableLabel: boolean;
};

const PRINT_OPTS_KEY = "chaya_merchant_table_print_opts_v3";

const LEGACY_SIZE_CM: Record<string, MerchantTablePrintDimensions> = {
  sm: { widthCm: 4, heightCm: 6 },
  md: { widthCm: 6, heightCm: 8 },
  lg: { widthCm: 8, heightCm: 10 },
};

function roundCm(n: number): number {
  return Math.round(n * 10) / 10;
}

export function clampMerchantTablePrintDimensions(
  widthCm: number,
  heightCm: number,
): MerchantTablePrintDimensions {
  const w = roundCm(
    Math.min(MERCHANT_TABLE_PRINT_DIM_MAX_CM, Math.max(MERCHANT_TABLE_PRINT_DIM_MIN_CM, widthCm)),
  );
  const h = roundCm(
    Math.min(MERCHANT_TABLE_PRINT_DIM_MAX_CM, Math.max(MERCHANT_TABLE_PRINT_DIM_MIN_CM, heightCm)),
  );
  return { widthCm: w, heightCm: h };
}

export function parseMerchantTablePrintDimensions(
  widthRaw: unknown,
  heightRaw: unknown,
  legacySizeRaw?: unknown,
): MerchantTablePrintDimensions {
  const w = typeof widthRaw === "string" ? Number.parseFloat(widthRaw) : Number(widthRaw);
  const h = typeof heightRaw === "string" ? Number.parseFloat(heightRaw) : Number(heightRaw);
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
    return clampMerchantTablePrintDimensions(w, h);
  }
  if (typeof legacySizeRaw === "string" && LEGACY_SIZE_CM[legacySizeRaw]) {
    return LEGACY_SIZE_CM[legacySizeRaw]!;
  }
  return {
    widthCm: MERCHANT_TABLE_PRINT_DEFAULT_WIDTH_CM,
    heightCm: MERCHANT_TABLE_PRINT_DEFAULT_HEIGHT_CM,
  };
}

export function formatMerchantTablePrintDimensions({ widthCm, heightCm }: MerchantTablePrintDimensions): string {
  return `${widthCm}×${heightCm}cm`;
}

/** 카드 안 QR 정사각형 한 변 길이(cm) */
export function merchantTablePrintQrCm(
  dims: MerchantTablePrintDimensions,
  showTableLabel: boolean,
): number {
  const padCm = 0.35;
  const storeLineCm = 0.55;
  const labelBlockCm = showTableLabel ? 1.05 : 0;
  const innerW = dims.widthCm - padCm * 2;
  const innerH = dims.heightCm - padCm * 2 - storeLineCm - labelBlockCm;
  const qr = Math.min(innerW * 0.92, innerH * 0.95);
  return roundCm(Math.max(1.2, Math.min(qr, 18)));
}

export function merchantTablePrintTableNumberPt(dims: MerchantTablePrintDimensions): number {
  return Math.round(Math.min(Math.max(dims.widthCm * 5.2, 14), 34));
}

export function merchantTablePrintStoreNamePt(dims: MerchantTablePrintDimensions): number {
  return Math.round(Math.min(Math.max(dims.widthCm * 1.35, 6), 9));
}

function readLegacyV2Size(): MerchantTablePrintDimensions | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("chaya_merchant_table_print_opts_v2");
    if (!raw) return null;
    const j = JSON.parse(raw) as { size?: unknown };
    if (typeof j.size === "string" && LEGACY_SIZE_CM[j.size]) return LEGACY_SIZE_CM[j.size]!;
  } catch {
    /* ignore */
  }
  return null;
}

export function readMerchantTablePrintOptions(): MerchantTablePrintOptions {
  const fallback: MerchantTablePrintOptions = {
    showTableLabel: true,
    widthCm: MERCHANT_TABLE_PRINT_DEFAULT_WIDTH_CM,
    heightCm: MERCHANT_TABLE_PRINT_DEFAULT_HEIGHT_CM,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PRINT_OPTS_KEY);
    if (!raw) {
      const legacy = readLegacyV2Size();
      return legacy ? { ...fallback, ...legacy } : fallback;
    }
    const j = JSON.parse(raw) as {
      showTableLabel?: unknown;
      widthCm?: unknown;
      heightCm?: unknown;
    };
    const dims = parseMerchantTablePrintDimensions(j.widthCm, j.heightCm);
    return {
      showTableLabel: j.showTableLabel !== false,
      ...dims,
    };
  } catch {
    return fallback;
  }
}

export function writeMerchantTablePrintOptions(opts: MerchantTablePrintOptions): void {
  if (typeof window === "undefined") return;
  const dims = clampMerchantTablePrintDimensions(opts.widthCm, opts.heightCm);
  try {
    localStorage.setItem(
      PRINT_OPTS_KEY,
      JSON.stringify({
        showTableLabel: opts.showTableLabel,
        widthCm: dims.widthCm,
        heightCm: dims.heightCm,
      }),
    );
  } catch {
    /* ignore */
  }
}

export function merchantTablesPrintHref(
  tenant: string,
  tableCodes: string[],
  opts?: Partial<MerchantTablePrintOptions>,
): string {
  const stored = readMerchantTablePrintOptions();
  const tEnc = encodeURIComponent(tenant.trim());
  const q = new URLSearchParams();
  if (tableCodes.length === 1) {
    q.set("only", tableCodes[0]!);
  } else if (tableCodes.length > 0) {
    q.set("codes", tableCodes.join(","));
  }
  const showLabel = opts?.showTableLabel ?? stored.showTableLabel;
  const dims = clampMerchantTablePrintDimensions(
    opts?.widthCm ?? stored.widthCm,
    opts?.heightCm ?? stored.heightCm,
  );
  q.set("label", showLabel ? "1" : "0");
  q.set("w", String(dims.widthCm));
  q.set("h", String(dims.heightCm));
  return `/m/${tEnc}/tables/print?${q}`;
}

export function merchantTablesExportHref(tenant: string, tableCodes?: string[]): string {
  const tEnc = encodeURIComponent(tenant.trim());
  if (!tableCodes?.length) return `/m/${tEnc}/tables/export`;
  const q = new URLSearchParams({ codes: tableCodes.join(",") });
  return `/m/${tEnc}/tables/export?${q}`;
}
