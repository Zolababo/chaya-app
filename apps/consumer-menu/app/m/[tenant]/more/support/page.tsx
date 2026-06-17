import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";

import { MerchantMoreSubPageBack } from "@/components/merchant-more-sub-page-back";
import { MerchantMoreSubPageShell } from "@/components/merchant-more-sub-page-shell";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import {
  MERCHANT_APP_VERSION,
  MERCHANT_SUPPORT_EMAIL,
  MERCHANT_SUPPORT_HOURS,
} from "@/lib/merchant/merchant-app-meta";
import { merchantSubCardClass } from "@/lib/merchant/merchant-more-sub-styles";
import { tenantBrandingFromSettings } from "@/lib/tenant/tenant-branding";
import { fetchTenantStoreSettings } from "@/lib/tenant/tenant-store-settings";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MerchantMoreSupportPage({ params }: Props) {
  const { tenant } = await params;
  await requireMerchantForTenant(tenant);
  const settings = await fetchTenantStoreSettings(tenant);
  const branding = tenantBrandingFromSettings(tenant, settings);
  const tEnc = encodeURIComponent(tenant);
  const mailSubject = encodeURIComponent(`[CHAYA] ${branding.displayName} 문의`);
  const mailHref = `mailto:${MERCHANT_SUPPORT_EMAIL}?subject=${mailSubject}`;

  return (
    <MerchantMoreSubPageShell>
      <MerchantMoreSubPageBack href={`/m/${tEnc}/more`} label="고객센터" />

      <section className={merchantSubCardClass}>
        <Link
          href={mailHref}
          className="flex min-h-[52px] items-center gap-3 px-4 transition active:bg-[#F2F3F5] dark:active:bg-zinc-900"
        >
          <MessageCircle className="h-[22px] w-[22px] shrink-0 text-[#4B5563]" strokeWidth={2} aria-hidden />
          <span className="flex-1 text-[15px] font-bold text-[#111827] dark:text-zinc-50">이메일 문의</span>
          <ChevronRight className="h-[18px] w-[18px] shrink-0 text-[#9CA3AF]" strokeWidth={2} aria-hidden />
        </Link>
      </section>

      <p className="text-center text-xs font-medium text-[#9CA3AF]">{MERCHANT_SUPPORT_HOURS}</p>
      <p className="text-center text-xs font-medium text-[#9CA3AF]">앱 버전 v{MERCHANT_APP_VERSION}</p>
    </MerchantMoreSubPageShell>
  );
}
