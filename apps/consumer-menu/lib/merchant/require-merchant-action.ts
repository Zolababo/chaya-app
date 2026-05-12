import { redirect } from "next/navigation";

import type { MerchantRole } from "@/lib/merchant/merchant-access";
import {
  fetchMerchantMembership,
  getMerchantTenantActionAccess,
  merchantAccessPendingUrl,
  merchantLoginUrl,
} from "@/lib/merchant/merchant-access";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

/**
 * 폼 바운드 테넌트에 대한 점주 권한을 검사합니다.
 * 세션이 없으면 로그인으로, 세션은 있는데 매장 매핑이 없으면 forbidden 으로 보냅니다.
 */
export async function requireMerchantOrderMutation(formData: FormData): Promise<{ role: MerchantRole }> {
  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const nextPath = tenant ? `/m/${encodeURIComponent(tenant)}/dashboard` : "/m";

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(merchantLoginUrl(nextPath));
  }

  const user = await resolveServerUser(supabase);
  if (!user) {
    redirect(merchantLoginUrl(nextPath));
  }

  const access = await getMerchantTenantActionAccess(formData);
  if (access) {
    return { role: access.role };
  }

  if (tenant) {
    const membership = await fetchMerchantMembership(supabase, user.id, tenant);
    if (membership && membership.approvedAt == null) {
      redirect(merchantAccessPendingUrl(tenant));
    }
  }

  redirect("/m/forbidden");
}
