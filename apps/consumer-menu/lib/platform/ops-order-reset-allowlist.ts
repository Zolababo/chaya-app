import "server-only";

import { CONSUMER_DEMO_TENANT_SLUG } from "@/lib/consumer/root-entry";

function extraAllowlist(): string[] {
  const raw = process.env.OPS_ORDER_RESET_ALLOWED_TENANTS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Ops에서 주문 일괄 삭제(데모 초기화)를 허용하는 테넌트만 true */
export function isOpsOrderResetAllowed(tenantSlug: string): boolean {
  const slug = tenantSlug.trim().toLowerCase();
  if (!slug) return false;
  if (slug === CONSUMER_DEMO_TENANT_SLUG) return true;
  return extraAllowlist().includes(slug);
}
