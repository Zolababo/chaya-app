import type { ReactNode } from "react";
import { Suspense } from "react";

import { MerchantLoadingCenter } from "@/components/merchant-loading-center";
import { MerchantMainTabShell } from "@/components/merchant-main-tab-shell";
import { MerchantBottomNav } from "@/components/merchant-bottom-nav";
import { MerchantHeaderOverlayHost } from "@/components/merchant-header-overlay-host";
import { MerchantHomeHeader } from "@/components/merchant-home-header";
import { MerchantLiveSync } from "@/components/merchant-live-sync";
import { MerchantNewOrderAlertListener } from "@/components/merchant-new-order-alert-listener";
import { MerchantPreviewBanner } from "@/components/merchant-preview-banner";
import { MerchantSubnav } from "@/components/merchant-subnav";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { MerchantHeaderOverlayProvider } from "@/lib/merchant/merchant-header-overlay-context";
import { MerchantPendingCountProvider } from "@/lib/merchant/merchant-pending-count-context";
import {
  canManageMerchantMenus,
  canMutateMerchantOrders,
} from "@/lib/merchant/merchant-role-capabilities";
import { tenantBrandingFromSettings } from "@/lib/tenant/tenant-branding";
import {
  chayaMerchantShellClass,
  merchantShellWithCompactNavClass,
} from "@/lib/responsive/chaya-app-shell";
import { fetchTenantStoreSettings } from "@/lib/tenant/tenant-store-settings";

export const dynamic = "force-dynamic";

export default async function MerchantTenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const { role } = await requireMerchantForTenant(tenant);
  const canManageMenus = canManageMerchantMenus(role);
  const canMutateOrders = canMutateMerchantOrders(role);
  const settings = await fetchTenantStoreSettings(tenant);
  const branding = tenantBrandingFromSettings(tenant, settings);

  return (
    <MerchantHeaderOverlayProvider>
      <MerchantPendingCountProvider initialCount={null}>
        <MerchantLiveSync tenant={tenant} />
        <MerchantNewOrderAlertListener tenant={tenant} />
        <div className="min-h-dvh bg-[#F2F3F5] dark:bg-zinc-950">
          <MerchantHomeHeader
            tenant={tenant}
            storeName={branding.displayName}
            logoUrl={branding.logoUrl}
          />
          <div className={`${chayaMerchantShellClass} ${merchantShellWithCompactNavClass}`}>
            <MerchantPreviewBanner tenantSlug={tenant} />
            <MerchantSubnav tenant={tenant} canManageMenus={canManageMenus} />
            <Suspense fallback={<MerchantLoadingCenter />}>
              <MerchantMainTabShell
                tenant={tenant}
                role={role}
                canManageMenus={canManageMenus}
                canMutateOrders={canMutateOrders}
              >
                {children}
              </MerchantMainTabShell>
            </Suspense>
          </div>
        </div>
        <MerchantBottomNav tenant={tenant} canManageMenus={canManageMenus} />
        <MerchantHeaderOverlayHost tenant={tenant} />
      </MerchantPendingCountProvider>
    </MerchantHeaderOverlayProvider>
  );
}
