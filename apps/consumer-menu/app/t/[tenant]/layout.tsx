import { Suspense } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { SessionHeader } from "@/components/session-header";
import { SessionHeaderFallback } from "@/components/header-fallback";
import { TenantTableQuerySync } from "@/components/tenant-table-query-sync";

export default async function TenantLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}>) {
  const { tenant } = await params;

  return (
    <div className="flex min-h-dvh flex-col bg-chaya-bg pb-28 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Suspense fallback={<SessionHeaderFallback />}>
        <SessionHeader tenant={tenant} />
        <TenantTableQuerySync tenant={tenant} />
      </Suspense>
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6">{children}</div>
      <BottomNav tenant={tenant} />
    </div>
  );
}
