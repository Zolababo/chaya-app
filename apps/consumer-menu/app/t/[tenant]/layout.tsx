import type { Metadata } from "next";
import { Suspense } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { MenuCartStickyBar } from "@/components/menu-cart-sticky-bar";
import { GuestSessionCookieSync } from "@/components/guest-session-cookie-sync";
import { GuestSessionInit } from "@/components/guest-session-init";
import { SessionHeaderFallback } from "@/components/header-fallback";
import { TenantSessionHeader } from "@/components/tenant-session-header";
import { SkipToMainLink } from "@/components/skip-to-main-link";
import { InvalidTableQueryBanner } from "@/components/invalid-table-query-banner";
import { TenantTableQuerySync } from "@/components/tenant-table-query-sync";
import { ConsumerEasyModeProvider } from "@/lib/consumer/consumer-easy-mode-context";
import { TenantTablesProvider } from "@/lib/consumer/tenant-tables-context";
import { listActiveTenantTablesForConsumer } from "@/lib/tables/list-tenant-tables";
import { ConsumerLocaleProvider } from "@/lib/i18n/consumer-locale-context";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { tenantBrandingFromSettings } from "@/lib/tenant/tenant-branding";
import { chayaConsumerShellClass } from "@/lib/responsive/chaya-app-shell";
import { fetchTenantStoreSettings } from "@/lib/tenant/tenant-store-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const branding = tenantBrandingFromSettings(tenant, await fetchTenantStoreSettings(tenant));
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
  const activeTables = await listActiveTenantTablesForConsumer(tenant);

  return (
    <Suspense>
      <ConsumerLocaleProvider locale={locale}>
        <TenantTablesProvider tenant={tenant} tables={activeTables}>
        <ConsumerEasyModeProvider tenant={tenant}>
        <div className="flex min-h-dvh flex-col bg-chaya-bg pb-[var(--chaya-consumer-nav-clearance)] text-zinc-900">
          <SkipToMainLink />
          <GuestSessionInit />
          <GuestSessionCookieSync />
          <Suspense fallback={<SessionHeaderFallback />}>
            <TenantSessionHeader tenant={tenant} />
            <InvalidTableQueryBanner tenant={tenant} />
            <TenantTableQuerySync tenant={tenant} />
          </Suspense>
          <main
            id="main-content"
            tabIndex={-1}
            className={`${chayaConsumerShellClass} flex-1 py-2 outline-none`}
          >
            {children}
          </main>
          <MenuCartStickyBar tenant={tenant} />
          <BottomNav tenant={tenant} />
        </div>
        </ConsumerEasyModeProvider>
        </TenantTablesProvider>
      </ConsumerLocaleProvider>
    </Suspense>
  );
}
