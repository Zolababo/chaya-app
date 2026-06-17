import { NextResponse, type NextRequest } from "next/server";

import { recordTenantQrVisit } from "@/lib/tables/record-tenant-qr-visit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ tenant: string }> };

/** POST /t/{tenant}/qr-visit — QR 메뉴 접속 1회 기록 (세션당 1회, 클라이언트 dedupe) */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { tenant } = await ctx.params;
  let table = "";
  try {
    const body = (await request.json()) as { table?: unknown };
    table = typeof body.table === "string" ? body.table : "";
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!table.trim()) {
    return NextResponse.json({ error: "missing_table" }, { status: 400 });
  }

  await recordTenantQrVisit(tenant, table);
  return new NextResponse(null, { status: 204 });
}
