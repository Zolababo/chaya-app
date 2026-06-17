import { Suspense } from "react";

import { ConsumerHeaderToolbar } from "@/components/consumer-header-toolbar";
import { SessionHeader } from "@/components/session-header";
import { tenantBrandingFromSettings } from "@/lib/tenant/tenant-branding";
import { fetchTenantStoreSettings } from "@/lib/tenant/tenant-store-settings";

type Props = {
  tenant: string;
};

export async function TenantSessionHeader({ tenant }: Props) {
  const branding = tenantBrandingFromSettings(tenant, await fetchTenantStoreSettings(tenant));

  return (
    <SessionHeader
      tenant={tenant}
      displayName={branding.displayName}
      logoUrl={branding.logoUrl}
      toolbarSlot={
        <Suspense fallback={null}>
          <ConsumerHeaderToolbar tenant={tenant} />
        </Suspense>
      }
    />
  );
}
