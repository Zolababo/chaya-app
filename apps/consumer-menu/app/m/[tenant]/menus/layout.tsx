import type { ReactNode } from "react";

import { MerchantMenusRouteShell } from "@/components/merchant-menus-route-shell";

type Props = {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
};

export default async function MerchantMenusLayout({ children, params }: Props) {
  const { tenant } = await params;
  return <MerchantMenusRouteShell tenant={tenant}>{children}</MerchantMenusRouteShell>;
}
