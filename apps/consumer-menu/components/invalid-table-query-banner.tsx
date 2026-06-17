"use client";

import { useTenantTableSelection } from "@/lib/cart/use-tenant-table-selection";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

type Props = {
  tenant: string;
};

export function InvalidTableQueryBanner({ tenant }: Props) {
  const { m } = useConsumerLocale();
  const { invalidQuery, hasRegistry } = useTenantTableSelection(tenant);

  if (!hasRegistry || !invalidQuery) return null;

  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
    >
      {m.header.invalidTableQr}
    </div>
  );
}
