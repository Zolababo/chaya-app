import { NextResponse } from "next/server";

import { buildOpsStoresCsv } from "@/lib/platform/ops-stores-csv";
import { listPlatformStores } from "@/lib/platform/list-platform-stores";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

export const dynamic = "force-dynamic";

/** GET /ops/stores/export — 플랫폼 매장 목록 CSV */
export async function GET() {
  await requirePlatformOperator("/ops/stores");

  const result = await listPlatformStores();
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const body = buildOpsStoresCsv(result.stores);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `ops-stores-${stamp}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
