import { MerchantMoreSubPageBack } from "@/components/merchant-more-sub-page-back";
import { MerchantMoreSubPageShell } from "@/components/merchant-more-sub-page-shell";
import { MerchantTableQrPreviewClient } from "@/components/merchant-table-qr-preview-client";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { getServerSiteBaseUrl } from "@/lib/notifications/site-base-url";
import { buildSignedConsumerTableUrl } from "@/lib/tables/build-signed-consumer-table-url";
import { merchantTableQrImagePath } from "@/lib/tables/consumer-table-url";
import { listTenantTablesForMerchant } from "@/lib/tables/list-tenant-tables";
import { matchActiveTableCode, normalizeTableCode } from "@/lib/tables/tenant-table-code";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string; code: string }>;
};

export default async function MerchantTableQrPreviewPage({ params }: Props) {
  const { tenant, code: codeRaw } = await params;
  await requireMerchantForTenant(tenant);
  const norm = normalizeTableCode(codeRaw);
  if (!norm.ok) notFound();

  const list = await listTenantTablesForMerchant(tenant);
  if (!list.ok) notFound();

  const dbCode = matchActiveTableCode(list.items, codeRaw);
  if (!dbCode) notFound();

  const tEnc = encodeURIComponent(tenant);
  const consumerUrl = buildSignedConsumerTableUrl(tenant, dbCode, getServerSiteBaseUrl());
  const qrImagePath = merchantTableQrImagePath(tenant, dbCode);

  return (
    <MerchantMoreSubPageShell>
      <MerchantMoreSubPageBack href={`/m/${tEnc}/tables`} label="QR 미리보기" />
      <MerchantTableQrPreviewClient
        tenant={tenant}
        tableCode={dbCode}
        consumerUrl={consumerUrl}
        qrImagePath={qrImagePath}
      />
    </MerchantMoreSubPageShell>
  );
}
