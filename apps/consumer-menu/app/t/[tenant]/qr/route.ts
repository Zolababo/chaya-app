import { NextResponse, type NextRequest } from "next/server";

import {
  mintTableOrderGate,
  verifyStaticTableQr,
} from "@/lib/security/table-qr-token";
import { buildConsumerTableUrlPath } from "@/lib/tables/consumer-table-url";
import { validateGuestTableNo } from "@/lib/tables/validate-guest-table";

type Ctx = { params: Promise<{ tenant: string }> };

/** 테이블 QR 스캔 — 스캔 시점부터 주문 권한(HttpOnly) 발급 후 메뉴로 이동. */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { tenant } = await ctx.params;
  const slug = tenant.trim();
  const tableRaw = request.nextUrl.searchParams.get("table")?.trim() ?? "";
  const tsig = request.nextUrl.searchParams.get("tsig")?.trim() ?? "";

  const menuPath = buildConsumerTableUrlPath(slug, tableRaw || "");
  const redirectUrl = new URL(menuPath, request.nextUrl.origin);

  if (!tableRaw) {
    return NextResponse.redirect(new URL(`/t/${encodeURIComponent(slug)}`, request.nextUrl.origin));
  }

  const tableCheck = await validateGuestTableNo(slug, tableRaw);
  if (!tableCheck.ok || !tableCheck.tableNo) {
    redirectUrl.searchParams.set("e", "invalid_table");
    return NextResponse.redirect(redirectUrl);
  }

  if (!verifyStaticTableQr(slug, tableCheck.tableNo, tsig)) {
    redirectUrl.searchParams.set("e", "table_qr");
    return NextResponse.redirect(redirectUrl);
  }

  const gate = mintTableOrderGate(slug, tableCheck.tableNo);
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set(gate.cookieName, gate.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: gate.maxAgeSec,
    path: `/t/${encodeURIComponent(slug)}`,
  });
  return res;
}
