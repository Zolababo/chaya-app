import type { MerchantAuditEventRow } from "@/lib/merchant/list-merchant-audit-events";
import { buildMerchantAuditCsv } from "@/lib/merchant/merchant-audit-csv";

import type { OpsAuditEventRow } from "@/lib/platform/list-ops-audit-events";

export function buildOpsAuditCsv(rows: OpsAuditEventRow[]): string {
  return buildMerchantAuditCsv(rows as unknown as MerchantAuditEventRow[]);
}
