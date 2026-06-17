import Link from "next/link";

import { MerchantReadinessInternalChecklist } from "@/components/merchant-readiness-internal-checklist";
import { MerchantReadinessOwnerChecklist } from "@/components/merchant-readiness-owner-checklist";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { isMerchantInternalUiVisible } from "@/lib/merchant/merchant-internal-ui";
import {
  canManageMerchantMenus,
  canManageTenantTables,
} from "@/lib/merchant/merchant-role-capabilities";
import { listMenusForMerchant } from "@/lib/menus/list-menus-for-merchant";
import { listTenantTablesForMerchant } from "@/lib/tables/list-tenant-tables";
import { getTenantBranding } from "@/lib/tenant/tenant-branding";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MerchantReadinessPage({ params }: Props) {
  const { tenant } = await params;

  const { role } = await requireMerchantForTenant(tenant);
  const branding = getTenantBranding(tenant);
  const canManageMenus = canManageMerchantMenus(role);
  const canManageTables = canManageTenantTables(role);
  const tEnc = encodeURIComponent(tenant);

  const [menus, tables] = await Promise.all([
    listMenusForMerchant(tenant),
    listTenantTablesForMerchant(tenant),
  ]);

  const menuCount = menus.ok ? menus.items.length : 0;
  const activeTableCount = tables.ok ? tables.items.filter((t) => t.is_active).length : 0;

  return (
    <>
      <header className="mb-6 border-b border-chaya-border pb-5 dark:border-zinc-700">
        <Link
          href={`/m/${tEnc}/dashboard`}
          className="text-sm font-semibold text-chaya-primary underline-offset-2 hover:underline"
        >
          ← 홈
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">운영 체크</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {branding.displayName} — 실매장 오픈 전에 메뉴·QR·주문 흐름을 한 번에 점검합니다.
        </p>
      </header>

      <MerchantReadinessOwnerChecklist
        tenant={tenant}
        menuCount={menuCount}
        activeTableCount={activeTableCount}
        canManageMenus={canManageMenus}
        canManageTables={canManageTables}
      />

      {isMerchantInternalUiVisible() ? <MerchantReadinessInternalChecklist /> : null}
    </>
  );
}
