export const TENANT_BILLING_PLANS = ["trial", "starter", "growth"] as const;

export type TenantBillingPlan = (typeof TENANT_BILLING_PLANS)[number];

export const TENANT_BILLING_PLAN_LABELS: Record<TenantBillingPlan, string> = {
  trial: "체험 (Trial)",
  starter: "스타터",
  growth: "그로스",
};

export function parseTenantBillingPlan(raw: unknown): TenantBillingPlan {
  if (typeof raw === "string" && (TENANT_BILLING_PLANS as readonly string[]).includes(raw)) {
    return raw as TenantBillingPlan;
  }
  return "starter";
}
