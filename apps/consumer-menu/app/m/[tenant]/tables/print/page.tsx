import Link from "next/link";

import { MerchantTablesPrintSheet } from "@/components/merchant-tables-print-sheet";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import {
  formatMerchantTablePrintDimensions,
  parseMerchantTablePrintDimensions,
} from "@/lib/merchant/merchant-table-qr-batch";
import { getServerSiteBaseUrl } from "@/lib/notifications/site-base-url";
import { listTenantTablesForMerchant } from "@/lib/tables/list-tenant-tables";
import { tenantBrandingFromSettings } from "@/lib/tenant/tenant-branding";
import { fetchTenantStoreSettings } from "@/lib/tenant/tenant-store-settings";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ only?: string; codes?: string; label?: string; w?: string; h?: string; size?: string }>;
};

function parseTableCodes(onlyRaw: string, codesRaw: string, activeCodes: string[]): string[] {
  if (onlyRaw) return [onlyRaw.trim()];
  if (!codesRaw.trim()) return activeCodes;
  const wanted = new Set(
    codesRaw
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  );
  return activeCodes.filter((c) => wanted.has(c));
}

export default async function MerchantTablesPrintPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  await requireMerchantForTenant(tenant);

  const [list, settings] = await Promise.all([
    listTenantTablesForMerchant(tenant),
    fetchTenantStoreSettings(tenant),
  ]);
  const storeName = tenantBrandingFromSettings(tenant, settings).displayName;

  const onlyRaw = sp.only?.trim() ?? "";
  const codesRaw = sp.codes?.trim() ?? "";
  const showTableLabel = sp.label !== "0";
  const dimensions = parseMerchantTablePrintDimensions(sp.w, sp.h, sp.size);
  const items = list.ok ? list.items.filter((t) => t.is_active) : [];
  const activeCodes = items.map((t) => t.table_code);
  const selectedCodes = parseTableCodes(onlyRaw, codesRaw, activeCodes);
  const filtered =
    selectedCodes.length > 0
      ? items.filter((t) => selectedCodes.includes(t.table_code))
      : items;

  const siteBase = getServerSiteBaseUrl();
  const countLabel = filtered.length === items.length ? "전체" : `${filtered.length}개`;
  const sizeLabel = formatMerchantTablePrintDimensions(dimensions);

  return (
    <div className="min-h-dvh bg-white text-zinc-900 print:min-h-0">
      <div className="mx-auto max-w-5xl px-4 py-6 print:hidden">
        <Link
          href={`/m/${encodeURIComponent(tenant)}/tables`}
          className="text-sm font-semibold text-chaya-primary underline"
        >
          ← 테이블·QR로 돌아가기
        </Link>
        <h1 className="mt-4 text-xl font-bold">QR 인쇄 미리보기</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {countLabel} · {sizeLabel} · {storeName} · 테이블 번호 {showTableLabel ? "표시" : "숨김"}
        </p>
      </div>
      {!list.ok ? (
        <p className="px-4 text-sm text-red-700">{list.message}</p>
      ) : filtered.length === 0 ? (
        <p className="px-4 text-sm text-zinc-600">인쇄할 테이블이 없습니다.</p>
      ) : (
        <MerchantTablesPrintSheet
          tenant={tenant}
          storeName={storeName}
          tables={filtered}
          siteBase={siteBase}
          showTableLabel={showTableLabel}
          dimensions={dimensions}
        />
      )}
    </div>
  );
}
