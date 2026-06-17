import { MerchantDeviceManagement } from "@/components/merchant-device-management";
import { MerchantMoreSubPageBack } from "@/components/merchant-more-sub-page-back";
import { MerchantMoreSubPageShell } from "@/components/merchant-more-sub-page-shell";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

/** 직원 초대 없음 — 1계정·다기기 「기기 관리」 */
export default async function MerchantMoreDevicesPage({ params }: Props) {
  const { tenant } = await params;
  await requireMerchantForTenant(tenant);
  const tEnc = encodeURIComponent(tenant);

  const supabase = await createSupabaseServerClient();
  const user = supabase ? await resolveServerUser(supabase) : null;
  const loginEmail = user?.email?.trim() ?? null;

  return (
    <MerchantMoreSubPageShell>
      <MerchantMoreSubPageBack href={`/m/${tEnc}/more`} label="로그인 기기" />
      <MerchantDeviceManagement loginEmail={loginEmail} />
    </MerchantMoreSubPageShell>
  );
}
