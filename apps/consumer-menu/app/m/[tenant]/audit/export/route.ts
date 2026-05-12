import { NextResponse, type NextRequest } from "next/server";

import { buildMerchantAuditCsv } from "@/lib/merchant/merchant-audit-csv";
import { fetchMerchantMembership, merchantAccessPendingUrl } from "@/lib/merchant/merchant-access";
import { fetchMerchantAuditEventsForExport, MERCHANT_AUDIT_CSV_MAX_ROWS } from "@/lib/merchant/list-merchant-audit-events";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export const dynamic = "force-dynamic";

/**
 * 감사 로그 CSV (GET, 읽기 전용). 세션 + 멤버십 확인 후 RLS 클라이언트로 데이터 조회.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 설정 없음" }, { status: 500 });
  }

  const user = await resolveServerUser(supabase);
  if (!user) {
    const u = new URL("/m/login", request.nextUrl.origin);
    u.searchParams.set("next", `/m/${encodeURIComponent(tenant)}/audit`);
    return NextResponse.redirect(u);
  }

  const membership = await fetchMerchantMembership(supabase, user.id, tenant);
  if (!membership) {
    return NextResponse.redirect(new URL("/m/forbidden", request.nextUrl.origin));
  }
  if (membership.approvedAt == null) {
    return NextResponse.redirect(new URL(merchantAccessPendingUrl(tenant), request.nextUrl.origin));
  }

  const sp = request.nextUrl.searchParams;
  const result = await fetchMerchantAuditEventsForExport({
    tenantSlug: tenant,
    action: sp.get("action"),
    fromYmd: sp.get("from"),
    toYmd: sp.get("to"),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const body = buildMerchantAuditCsv(result.rows);
  const filename = `audit-${encodeURIComponent(tenant)}.csv`;

  const headers: Record<string, string> = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
  if (result.truncated) {
    headers["X-Audit-Export-Truncated"] = "true";
    headers["X-Audit-Export-Row-Limit"] = String(MERCHANT_AUDIT_CSV_MAX_ROWS);
  }

  return new NextResponse(body, { status: 200, headers });
}
