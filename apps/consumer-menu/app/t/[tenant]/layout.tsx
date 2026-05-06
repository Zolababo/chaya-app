import type { Metadata } from "next";
import { Suspense } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { GuestSessionCookieSync } from "@/components/guest-session-cookie-sync";
import { SessionHeader } from "@/components/session-header";
import { SessionHeaderFallback } from "@/components/header-fallback";
import { SkipToMainLink } from "@/components/skip-to-main-link";
import { TenantTableQuerySync } from "@/components/tenant-table-query-sync";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const raw = (tenant ?? "").trim();
  const slug = raw ? decodeURIComponent(raw) : "";
  const label = slug || "매장";

  return {
    title: label,
    description: `${label} 주문 메뉴판`,
    openGraph: {
      title: label,
      description: `${label}에서 메뉴를 확인하고 주문합니다.`,
      type: "website",
    },
  };
}

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
      <SkipToMainLink />
      <GuestSessionCookieSync />
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
