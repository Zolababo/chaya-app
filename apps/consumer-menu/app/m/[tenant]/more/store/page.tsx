import { MerchantMoreFlash } from "@/components/merchant-more-flash";
import { MerchantMoreSubPageBack } from "@/components/merchant-more-sub-page-back";
import { MerchantMoreSubPageShell } from "@/components/merchant-more-sub-page-shell";
import { MerchantStoreSettingsForm } from "@/components/merchant-store-settings-form";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { merchantMoreFlashMessage } from "@/lib/merchant/merchant-more-messages";
import { canManageMerchantStoreProfile } from "@/lib/merchant/merchant-role-capabilities";
import {
  parseMerchantStoreFocus,
} from "@/lib/merchant/merchant-store-settings-focus";
import { fetchTenantStoreSettings } from "@/lib/tenant/tenant-store-settings";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ e?: string; ok?: string; focus?: string; d?: string }>;
};

export default async function MerchantMoreStorePage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  const { role } = await requireMerchantForTenant(tenant);
  const settings = await fetchTenantStoreSettings(tenant);
  const canEdit = canManageMerchantStoreProfile(role);
  const flash = merchantMoreFlashMessage("store", sp.e ?? sp.ok);
  const uploadDetail =
    sp.e === "logo_upload" && sp.d
      ? (() => {
          try {
            return decodeURIComponent(sp.d);
          } catch {
            return null;
          }
        })()
      : null;
  const focus = parseMerchantStoreFocus(sp.focus);
  const tEnc = encodeURIComponent(tenant);

  return (
    <MerchantMoreSubPageShell>
      <MerchantMoreSubPageBack href={`/m/${tEnc}/more`} label="매장 정보" />

      {flash ? <MerchantMoreFlash kind={flash.kind}>{flash.text}</MerchantMoreFlash> : null}
      {uploadDetail ? (
        <MerchantMoreFlash kind="error">{uploadDetail}</MerchantMoreFlash>
      ) : null}

      <MerchantStoreSettingsForm tenant={tenant} settings={settings} canEdit={canEdit} focus={focus} />
    </MerchantMoreSubPageShell>
  );
}
