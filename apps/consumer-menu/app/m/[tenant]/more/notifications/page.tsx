import { MerchantAlertSettingsPanel } from "@/components/merchant-alert-settings-panel";
import { MerchantMoreSubPageBack } from "@/components/merchant-more-sub-page-back";
import { MerchantMoreSubPageShell } from "@/components/merchant-more-sub-page-shell";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { canUseMerchantWebPush } from "@/lib/merchant/merchant-role-capabilities";
import { getMerchantVapidPublicKeyForClient } from "@/lib/notifications/merchant-push-config";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MerchantMoreNotificationsPage({ params }: Props) {
  const { tenant } = await params;
  const { role } = await requireMerchantForTenant(tenant);
  const tEnc = encodeURIComponent(tenant);
  const canEditPush = canUseMerchantWebPush(role);
  const vapidPublicKey = getMerchantVapidPublicKeyForClient();

  return (
    <MerchantMoreSubPageShell>
      <MerchantMoreSubPageBack href={`/m/${tEnc}/more`} label="주문 알림" />
      <MerchantAlertSettingsPanel
        tenant={tenant}
        vapidPublicKey={vapidPublicKey}
        showWebPush
        canEditPush={canEditPush}
      />
    </MerchantMoreSubPageShell>
  );
}
