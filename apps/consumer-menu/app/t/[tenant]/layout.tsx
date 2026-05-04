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
      <a
        href="#main-content"
        className="pointer-events-none fixed left-4 top-4 z-[100] rounded-xl bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary opacity-0 shadow-lg ring-2 ring-white transition-opacity focus:pointer-events-auto focus:opacity-100 focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-blue-600 dark:ring-zinc-900"
        aria-label="본문 영역으로 건너뛰기"
      >
        본문으로 바로가기
      </a>
      <Suspense fallback={<SessionHeaderFallback />}>
        <SessionHeader tenant={tenant} />
        <TenantTableQuerySync tenant={tenant} />
      </Suspense>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 outline-none sm:px-6">
        {children}
      </main>
      <BottomNav tenant={tenant} />
    </div>
  );
}
