import type { ReactNode } from "react";

import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";

export const dynamic = "force-dynamic";

export default async function MerchantTenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  await requireMerchantForTenant(tenant);
  return children;
}
