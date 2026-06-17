import type { PlatformStoreSummary } from "@/lib/platform/list-platform-stores";

function esc(v: string): string {
  if (/[\r\n",]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function buildOpsStoresCsv(stores: PlatformStoreSummary[]): string {
  const header = [
    "tenant_slug",
    "display_name",
    "health_score",
    "operating_status",
    "at_risk",
    "menu_count",
    "active_table_count",
    "today_sales",
    "today_orders",
    "orders_last_7d",
    "orders_last_30d",
    "last_order_at",
    "last_merchant_activity_at",
    "first_member_at",
    "onboarding_percent",
  ];
  const lines = [header.join(",")];
  for (const s of stores) {
    lines.push(
      [
        s.tenantSlug,
        s.displayName,
        String(s.health.score),
        s.operatingStatus,
        s.atRisk ? "yes" : "no",
        String(s.menuCount),
        String(s.activeTableCount),
        String(s.todaySales),
        String(s.todayOrderCount),
        String(s.ordersLast7d),
        String(s.ordersLast30d),
        s.lastOrderAt ?? "",
        s.lastMerchantActivityAt ?? "",
        s.firstMemberAt ?? "",
        String(s.onboardingPercent),
      ]
        .map((c) => esc(String(c)))
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}`;
}
