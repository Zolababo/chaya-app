import type { MerchantAuditEventRow } from "@/lib/merchant/list-merchant-audit-events";

export function buildMerchantAuditCsv(rows: MerchantAuditEventRow[]): string {
  const esc = (v: string) => {
    if (/[\r\n",]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const header = ["id", "created_at", "tenant_slug", "actor_user_id", "action", "detail_json"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const detailStr = JSON.stringify(r.detail);
    lines.push(
      [r.id, r.created_at, r.tenant_slug, r.actor_user_id, r.action, detailStr]
        .map((c) => esc(String(c)))
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}`;
}
