import { NextResponse, type NextRequest } from "next/server";

import {
  fetchMerchantMembership,
  merchantAccessPendingUrl,
  merchantLoginUrl,
} from "@/lib/merchant/merchant-access";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export type MerchantTableRouteAuth =
  | { ok: true }
  | { ok: false; response: NextResponse };

/** 테이블 QR·ZIP 라우트용 점주 세션 확인. */
export async function assertMerchantTableRoute(
  request: NextRequest,
  tenant: string,
  nextPath: string,
): Promise<MerchantTableRouteAuth> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, response: NextResponse.json({ error: "Supabase 설정 없음" }, { status: 500 }) };
  }

  const user = await resolveServerUser(supabase);
  if (!user) {
    const u = new URL(merchantLoginUrl(nextPath), request.nextUrl.origin);
    return { ok: false, response: NextResponse.redirect(u) };
  }

  const membership = await fetchMerchantMembership(supabase, user.id, tenant);
  if (!membership) {
    return { ok: false, response: NextResponse.redirect(new URL("/m/forbidden", request.nextUrl.origin)) };
  }
  if (membership.approvedAt == null) {
    return {
      ok: false,
      response: NextResponse.redirect(new URL(merchantAccessPendingUrl(tenant), request.nextUrl.origin)),
    };
  }

  return { ok: true };
}
