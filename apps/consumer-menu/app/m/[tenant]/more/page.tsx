import { MerchantMoreFlash } from "@/components/merchant-more-flash";
import { MerchantMoreHubContent } from "@/components/merchant-more-hub-content";
import { MerchantMoreSubPageShell } from "@/components/merchant-more-sub-page-shell";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { buildMerchantMoreSnapshot } from "@/lib/merchant/build-merchant-more-snapshot";
import { merchantLoginUsesSms } from "@/lib/merchant/merchant-login-mode";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ e?: string }>;
};

export default async function MerchantMorePage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  const { role } = await requireMerchantForTenant(tenant);
  const snapshot = await buildMerchantMoreSnapshot(tenant, role);

  const smsHint =
    sp.e === "sms_no_password" && merchantLoginUsesSms()
      ? "SMS 로그인 매장은 앱에서 비밀번호를 변경할 수 없습니다."
      : null;
  const forbiddenHint =
    sp.e === "forbidden" ? "이 메뉴는 현재 계정 권한으로 열 수 없습니다." : null;

  return (
    <MerchantMoreSubPageShell>
      {smsHint ? <MerchantMoreFlash kind="warn">{smsHint}</MerchantMoreFlash> : null}
      {forbiddenHint ? <MerchantMoreFlash kind="warn">{forbiddenHint}</MerchantMoreFlash> : null}

      <MerchantMoreHubContent {...snapshot} />
    </MerchantMoreSubPageShell>
  );
}
