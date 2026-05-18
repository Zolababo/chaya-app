import { Suspense } from "react";

import { ConsumerHeaderToolbar } from "@/components/consumer-header-toolbar";
import { SessionHeader } from "@/components/session-header";
import { getTenantBranding } from "@/lib/tenant/tenant-branding";

type Props = {
  tenant: string;
};

export async function TenantSessionHeader({ tenant }: Props) {
  const branding = getTenantBranding(tenant);

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
