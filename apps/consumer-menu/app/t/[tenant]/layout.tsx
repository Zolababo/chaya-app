import type { Metadata } from "next";
import { Suspense } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { MenuCartStickyBar } from "@/components/menu-cart-sticky-bar";
import { GuestSessionCookieSync } from "@/components/guest-session-cookie-sync";
import { SessionHeaderFallback } from "@/components/header-fallback";
import { TenantSessionHeader } from "@/components/tenant-session-header";
import { SkipToMainLink } from "@/components/skip-to-main-link";
import { TenantTableQuerySync } from "@/components/tenant-table-query-sync";
import { ConsumerLocaleProvider } from "@/lib/i18n/consumer-locale-context";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { getTenantBranding } from "@/lib/tenant/tenant-branding";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const branding = getTenantBranding(tenant);
  const titleLabel = branding.displayName;

  return {
    title: titleLabel,
    description: `${titleLabel} 메뉴 주문`,
    openGraph: {
      title: titleLabel,
      description: `${titleLabel} 메뉴 주문`,
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
  const locale = await getConsumerLocale();

  return (
    <Suspense>
      <ConsumerLocaleProvider locale={locale}>
        <div className="flex min-h-dvh flex-col bg-chaya-bg pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          <SkipToMainLink />
          <GuestSessionCookieSync />
          <Suspense fallback={<SessionHeaderFallback />}>
            <TenantSessionHeader tenant={tenant} />
            <TenantTableQuerySync tenant={tenant} />
          </Suspense>
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 outline-none sm:px-6"
          >
            {children}
          </main>
          <MenuCartStickyBar tenant={tenant} />
          <BottomNav tenant={tenant} />
        </div>
      </ConsumerLocaleProvider>
    </Suspense>
  );
}
