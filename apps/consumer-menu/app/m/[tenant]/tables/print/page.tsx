import Link from "next/link";

import { MerchantTablesPrintSheet } from "@/components/merchant-tables-print-sheet";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { getServerSiteBaseUrl } from "@/lib/notifications/site-base-url";
import { listTenantTablesForMerchant } from "@/lib/tables/list-tenant-tables";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ only?: string }>;
};

export default async function MerchantTablesPrintPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  await requireMerchantForTenant(tenant);

  const list = await listTenantTablesForMerchant(tenant);
  const onlyRaw = sp.only?.trim() ?? "";
  const items = list.ok ? list.items.filter((t) => t.is_active) : [];
  const filtered =
    onlyRaw && items.length > 0
      ? items.filter((t) => t.table_code === onlyRaw)
      : items;

  const siteBase = getServerSiteBaseUrl();

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
          아래 QR은 CHAYA가 만든 이미지입니다. 「인쇄」를 누르면 프린터·PDF 저장 대화상자가 열립니다.
        </p>
      </div>
      {!list.ok ? (
        <p className="px-4 text-sm text-red-700">{list.message}</p>
      ) : filtered.length === 0 ? (
        <p className="px-4 text-sm text-zinc-600">인쇄할 테이블이 없습니다.</p>
      ) : (
        <MerchantTablesPrintSheet tenant={tenant} tables={filtered} siteBase={siteBase} />
      )}
    </div>
  );
}
