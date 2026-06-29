import type { MerchantRole } from "@/lib/merchant/merchant-access";
import {
  canExportMerchantSales,
  canManageMerchantHours,
  canManageMerchantStoreProfile,
  canManageTenantTables,
  canUseMerchantWebPush,
  canViewMerchantDeviceHub,
} from "@/lib/merchant/merchant-role-capabilities";
import type { MerchantSettingsSheetSnapshot } from "@/lib/merchant/merchant-settings-sheet-types";
import { listTenantTablesForMerchant } from "@/lib/tables/list-tenant-tables";
import { tenantBrandingFromSettings } from "@/lib/tenant/tenant-branding";
import { fetchTenantStoreSettings, isKakaoAlimtalkLinked } from "@/lib/tenant/tenant-store-settings";

/** `/m/{tenant}/more` 허브·레이아웃 공통 스냅샷 */
export async function buildMerchantMoreSnapshot(
  tenant: string,
  role: MerchantRole,
): Promise<MerchantSettingsSheetSnapshot> {
  const [settings, tables] = await Promise.all([
    fetchTenantStoreSettings(tenant),
    listTenantTablesForMerchant(tenant),
  ]);
  const branding = tenantBrandingFromSettings(tenant, settings);
  const tableCount = tables.ok ? tables.items.filter((row) => row.is_active).length : null;
  return {
    tenant,
    storeName: branding.displayName,
    storeIntro: settings.intro,
    ordersAccepting: settings.ordersAccepting,
    breakStart: settings.breakStart,
    breakEnd: settings.breakEnd,
    businessOpen: settings.businessOpen,
    businessClose: settings.businessClose,
    salesDayCutoff: settings.salesDayCutoff,
    tableCount,
    staffCount: null,
    canManageStore: canManageMerchantStoreProfile(role),
    canManageHours: canManageMerchantHours(role),
    canManageTables: canManageTenantTables(role),
    canViewStaff: canViewMerchantDeviceHub(role),
    canUseNotifications: canUseMerchantWebPush(role),
    canExportSales: canExportMerchantSales(role),
    kakaoAlimtalkLinked: isKakaoAlimtalkLinked(settings),
  };
}
