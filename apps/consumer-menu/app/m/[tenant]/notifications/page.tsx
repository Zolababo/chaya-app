import { MerchantAnnouncementsPageClient } from "@/components/merchant-announcements-page-client";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MerchantNotificationsPage({ params }: Props) {
  const { tenant } = await params;
  await requireMerchantForTenant(tenant);

  return <MerchantAnnouncementsPageClient tenant={tenant} />;
}
