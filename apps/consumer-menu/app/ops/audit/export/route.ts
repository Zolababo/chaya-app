import { NextResponse, type NextRequest } from "next/server";

import { buildOpsAuditCsv } from "@/lib/platform/ops-audit-csv";
import { fetchOpsAuditEventsForExport, OPS_AUDIT_CSV_MAX_ROWS } from "@/lib/platform/list-ops-audit-events";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requirePlatformOperator("/ops/audit");

  const sp = request.nextUrl.searchParams;
  const result = await fetchOpsAuditEventsForExport({
    tenantSlug: sp.get("tenant"),
    action: sp.get("action"),
    fromYmd: sp.get("from"),
    toYmd: sp.get("to"),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const body = buildOpsAuditCsv(result.rows);
  const filename = "ops-audit-export.csv";

  const headers: Record<string, string> = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
  if (result.truncated) {
    headers["X-Audit-Export-Truncated"] = "true";
    headers["X-Audit-Export-Row-Limit"] = String(OPS_AUDIT_CSV_MAX_ROWS);
  }

  return new NextResponse(body, { status: 200, headers });
}
