import { redirect } from "next/navigation";

import type { MerchantRole } from "@/lib/merchant/merchant-access";
import { getMerchantTenantActionAccess, merchantLoginUrl } from "@/lib/merchant/merchant-access";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

/**
 * 폼 바운드 테넌트에 대한 점주 권한을 검사합니다.
 * 세션이 없으면 로그인으로, 세션은 있는데 매장 매핑이 없으면 forbidden 으로 보냅니다.
 */
export async function requireMerchantOrderMutation(formData: FormData): Promise<{ role: MerchantRole }> {
  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const nextPath = tenant ? `/m/${encodeURIComponent(tenant)}/orders` : "/m";

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/m/forbidden");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(merchantLoginUrl(nextPath));
  }

  const access = await getMerchantTenantActionAccess(formData);
  if (!access) {
    redirect("/m/forbidden");
  }

  return { role: access.role };
}
