import { NextResponse } from "next/server";

import { listActiveTenantTablesForConsumer } from "@/lib/tables/list-tenant-tables";

/** 손님앱 테이블 레지스트리 — layout 블로킹 없이 클라이언트 bootstrap */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const tables = await listActiveTenantTablesForConsumer(tenant);
  return NextResponse.json(
    { tables },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
