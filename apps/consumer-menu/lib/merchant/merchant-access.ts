import { redirect } from "next/navigation";
import { cache } from "react";

import { sanitizeInternalRedirectPath } from "@/lib/security/internal-redirect-path";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export type MerchantRole = "owner" | "staff";

export type MerchantMembershipRecord = {
  role: MerchantRole;
  /** `null` 이면 운영 승인 전 — 테넌트 라우트 접근 불가 */
  approvedAt: string | null;
};

/** 승인 대기 안내(무한 리다이렉트 방지: `requireMerchantForTenant` 를 쓰지 않는 페이지로만 이동). */
export function merchantAccessPendingUrl(tenantSlug: string): string {
  const t = tenantSlug.trim();
  return `/m/access-pending?tenant=${encodeURIComponent(t)}`;
}

/**
 * 점주 본인의 `merchant_tenant_members` 한 행을 읽습니다.
 * `approved_at` 컬럼은 `20260512120000_merchant_tenant_members_approved_at.sql` 이 적용된 뒤 사용됩니다.
 */
export async function fetchMerchantMembership(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  userId: string,
  tenantSlug: string,
): Promise<MerchantMembershipRecord | null> {
  const tenant = tenantSlug.trim();
  if (!tenant) return null;

  const { data: row, error } = await supabase
    .from("merchant_tenant_members")
    .select("role, approved_at")
    .eq("tenant_slug", tenant)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !row || typeof (row as { role?: unknown }).role !== "string") return null;

  const raw = row as { role: string; approved_at?: string | null };
  const r = raw.role;
  const role: MerchantRole = r === "staff" ? "staff" : "owner";

  const ap = raw.approved_at;
  const approvedAt: string | null = ap == null ? null : typeof ap === "string" ? ap : null;

  return { role, approvedAt };
}

/** 로그인 후 리디렉트용 경로 검증(`/m/*` 만 허용, `..` 등 정규화 탈출 차단). */
export function sanitizeMerchantNextPath(raw: string | undefined | null): string | null {
  return sanitizeInternalRedirectPath(raw, "merchant");
}

export function merchantLoginUrl(nextPath?: string | null): string {
  const next = sanitizeMerchantNextPath(nextPath);
  if (next) return `/m/login?next=${encodeURIComponent(next)}`;
  return "/m/login";
}

/** 레이아웃·페이지에서 동일 요청 내 중복 멤버십 조회를 합칩니다. */
export const requireMerchantForTenant = cache(async function requireMerchantForTenant(
  tenantRaw: string,
): Promise<{ role: MerchantRole }> {
  const tenant = tenantRaw.trim();
  if (!tenant) {
    redirect("/m/login");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(merchantLoginUrl(`/m/${encodeURIComponent(tenant)}/dashboard`));
  }

  const user = await resolveServerUser(supabase);
  if (!user) {
    redirect(merchantLoginUrl(`/m/${encodeURIComponent(tenant)}/dashboard`));
  }

  const membership = await fetchMerchantMembership(supabase, user.id, tenant);
  if (!membership) {
    redirect("/m/forbidden");
  }
  if (membership.approvedAt == null) {
    redirect(merchantAccessPendingUrl(tenant));
  }

  return { role: membership.role };
});

export async function getMerchantTenantActionAccess(
  formData: FormData,
): Promise<{ userId: string; tenant: string; role: MerchantRole } | null> {
  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  if (!tenant) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const user = await resolveServerUser(supabase);
  if (!user) return null;

  const membership = await fetchMerchantMembership(supabase, user.id, tenant);
  if (!membership || membership.approvedAt == null) return null;

  return { userId: user.id, tenant, role: membership.role };
}
