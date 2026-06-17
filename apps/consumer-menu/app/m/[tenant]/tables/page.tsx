import { MerchantMoreFlash } from "@/components/merchant-more-flash";
import { MerchantMoreSubPageBack } from "@/components/merchant-more-sub-page-back";
import { MerchantMoreSubPageShell } from "@/components/merchant-more-sub-page-shell";
import { MerchantTablesManager } from "@/components/merchant-tables-manager";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { merchantOwnerLoadErrorMessage } from "@/lib/merchant/merchant-owner-copy";
import { canManageTenantTables } from "@/lib/merchant/merchant-role-capabilities";
import {
  merchantTableErrorMessage,
  merchantTableOkMessage,
} from "@/lib/merchant/merchant-table-messages";
import { getServerSiteBaseUrl } from "@/lib/notifications/site-base-url";
import { listTenantTablesForMerchant } from "@/lib/tables/list-tenant-tables";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ e?: string; ok?: string; focus?: string }>;
};

export default async function MerchantTablesPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  const { role } = await requireMerchantForTenant(tenant);
  const canManageTables = canManageTenantTables(role);
  const tEnc = encodeURIComponent(tenant);

  const list = await listTenantTablesForMerchant(tenant);
  const errMsg = merchantTableErrorMessage(sp.e);
  const okMsg = merchantTableOkMessage(sp.ok);
  const listError = list.ok ? null : merchantOwnerLoadErrorMessage("tables", list.message);

  return (
    <MerchantMoreSubPageShell>
      <MerchantMoreSubPageBack href={`/m/${tEnc}/more`} label="테이블 · QR" />

      {errMsg ? <MerchantMoreFlash kind="error">{errMsg}</MerchantMoreFlash> : null}
      {okMsg ? <MerchantMoreFlash kind="ok">{okMsg}</MerchantMoreFlash> : null}

      <MerchantTablesManager
        tenant={tenant}
        items={list.ok ? list.items : []}
        listError={listError}
        siteBase={getServerSiteBaseUrl()}
        canManage={canManageTables}
      />
    </MerchantMoreSubPageShell>
  );
}
