import { NextResponse } from "next/server";

import {
  fetchMerchantMembership,
  type MerchantRole,
} from "@/lib/merchant/merchant-access";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUserForLiveApi } from "@/lib/supabase/resolve-server-user";

const NO_STORE = { headers: { "Cache-Control": "private, no-store, max-age=0" } } as const;

export type MerchantLiveAccess = {
  slug: string;
  role: MerchantRole;
};

/** 점주 live JSON API — 세션·멤버십 검증 */
export async function requireMerchantLiveJsonAccess(
  tenantSlug: string,
): Promise<MerchantLiveAccess | NextResponse> {
  const slug = tenantSlug.trim();
  if (!slug) {
    return NextResponse.json({ error: "bad_tenant" }, { status: 400, ...NO_STORE });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "no_client" }, { status: 503, ...NO_STORE });
  }

  const user = await resolveServerUserForLiveApi(supabase);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, ...NO_STORE });
  }

  const membership = await fetchMerchantMembership(supabase, user.id, slug);
  if (!membership?.approvedAt) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, ...NO_STORE });
  }

  return { slug, role: membership.role };
}

export { NO_STORE as MERCHANT_LIVE_JSON_HEADERS };
