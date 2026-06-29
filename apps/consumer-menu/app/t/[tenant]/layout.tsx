import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";

import { ConsumerBottomChromeIdle } from "@/components/consumer-bottom-chrome-idle";
import { ConsumerDataNotice } from "@/components/consumer-data-notice";
import { ConsumerTenantShellDeferred } from "@/components/consumer-tenant-shell-deferred";
import { MenuHomeEarlySsr } from "@/components/menu-home-early-ssr";
import { SessionHeaderFallback } from "@/components/header-fallback";
import { TenantSessionHeader } from "@/components/tenant-session-header";
import { SkipToMainLink } from "@/components/skip-to-main-link";
import { InvalidTableQueryBanner } from "@/components/invalid-table-query-banner";
import { TenantTableQuerySync } from "@/components/tenant-table-query-sync";
import { ConsumerEasyModeProvider } from "@/lib/consumer/consumer-easy-mode-context";
import { TenantTablesProvider } from "@/lib/consumer/tenant-tables-context";
import { ConsumerLocaleProvider } from "@/lib/i18n/consumer-locale-context";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { isConsumerMenuHomeRequest } from "@/lib/consumer/consumer-route";
import { chayaConsumerPwaBrand, chayaPwaMetadataIcons } from "@/lib/pwa/chaya-pwa-brand";
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
    manifest: `/t/${encodeURIComponent(tenant.trim())}/homescreen-manifest`,
    icons: chayaPwaMetadataIcons(chayaConsumerPwaBrand.icon),
    appleWebApp: {
      capable: true,
      title: titleLabel,
      statusBarStyle: "default",
    },
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
  const isMenuHome = isConsumerMenuHomeRequest(await headers());

  return (
    <Suspense>
      <ConsumerLocaleProvider locale={locale}>
        <TenantTablesProvider tenant={tenant} tables={[]} deferLoad>
        <ConsumerEasyModeProvider tenant={tenant}>
        <div className="flex min-h-dvh flex-col bg-chaya-bg pb-[var(--chaya-consumer-nav-clearance)] text-zinc-900">
          <SkipToMainLink />
          <ConsumerTenantShellDeferred />
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
            {isMenuHome ? (
              <div className="space-y-2">
                <MenuHomeEarlySsr tenant={tenant} />
              </div>
            ) : null}
            {children}
            <ConsumerDataNotice locale={locale} />
          </main>
          <ConsumerBottomChromeIdle tenant={tenant} />
        </div>
        </ConsumerEasyModeProvider>
        </TenantTablesProvider>
      </ConsumerLocaleProvider>
    </Suspense>
  );
}
