import { NextResponse, type NextRequest } from "next/server";

import {
  fetchMerchantSalesForExport,
  MERCHANT_SALES_CSV_MAX_ROWS,
} from "@/lib/merchant/merchant-sales-csv";
import { buildMerchantSalesXlsxBuffer } from "@/lib/merchant/merchant-sales-xlsx";
import { fetchMerchantMembership, merchantAccessPendingUrl } from "@/lib/merchant/merchant-access";
import { canExportMerchantSales } from "@/lib/merchant/merchant-role-capabilities";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 설정 없음" }, { status: 500 });
  }

  const user = await resolveServerUser(supabase);
  if (!user) {
    const u = new URL("/m/login", request.nextUrl.origin);
    u.searchParams.set("next", `/m/${encodeURIComponent(tenant)}/more/export`);
    return NextResponse.redirect(u);
  }

  const membership = await fetchMerchantMembership(supabase, user.id, tenant);
  if (!membership) {
    return NextResponse.redirect(new URL("/m/forbidden", request.nextUrl.origin));
  }
  if (membership.approvedAt == null) {
    return NextResponse.redirect(new URL(merchantAccessPendingUrl(tenant), request.nextUrl.origin));
  }
  if (!canExportMerchantSales(membership.role)) {
    return NextResponse.redirect(new URL(`/m/${encodeURIComponent(tenant)}/more`, request.nextUrl.origin));
  }

  const daysRaw = request.nextUrl.searchParams.get("days");
  const days = daysRaw ? Number(daysRaw) : 30;
  const result = await fetchMerchantSalesForExport(tenant, days);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const body = await buildMerchantSalesXlsxBuffer(result.rows);
  const filename = `sales-${tenant.replace(/[^a-zA-Z0-9_-]+/g, "_")}.xlsx`;
  const headers: Record<string, string> = {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
  if (result.truncated) {
    headers["X-Sales-Export-Truncated"] = "true";
    headers["X-Sales-Export-Row-Limit"] = String(MERCHANT_SALES_CSV_MAX_ROWS);
  }

  return new NextResponse(new Uint8Array(body), { status: 200, headers });
}
