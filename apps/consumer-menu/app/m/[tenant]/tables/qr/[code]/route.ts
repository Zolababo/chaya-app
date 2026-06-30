import { NextResponse, type NextRequest } from "next/server";

import { assertMerchantTableRoute } from "@/lib/tables/assert-merchant-table-route";
import { buildSignedConsumerTableUrl } from "@/lib/tables/build-signed-consumer-table-url";
import { generateTableQrPng } from "@/lib/tables/generate-table-qr-png";
import { listTenantTablesForMerchant } from "@/lib/tables/list-tenant-tables";
import { matchActiveTableCode, normalizeTableCode } from "@/lib/tables/tenant-table-code";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ tenant: string; code: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { tenant, code: codeRaw } = await ctx.params;
  const codeParam = codeRaw.replace(/\.png$/i, "");
  const norm = normalizeTableCode(codeParam);
  if (!norm.ok) {
    return NextResponse.json({ error: "invalid_table_code" }, { status: 400 });
  }

  const nextPath = `/m/${encodeURIComponent(tenant)}/tables`;
  const auth = await assertMerchantTableRoute(request, tenant, nextPath);
  if (!auth.ok) return auth.response;

  const list = await listTenantTablesForMerchant(tenant);
  if (!list.ok) {
    return NextResponse.json({ error: list.message }, { status: 500 });
  }
  const dbCode = matchActiveTableCode(list.items, codeParam);
  if (!dbCode) {
    return NextResponse.json({ error: "table_not_found" }, { status: 404 });
  }

  const url = buildSignedConsumerTableUrl(tenant, dbCode);
  let png: Buffer;
  try {
    png = await generateTableQrPng(url);
  } catch {
    return NextResponse.json({ error: "qr_generate_failed" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="table-${dbCode}-qr.png"`,
    },
  });
}
