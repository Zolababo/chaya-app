import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export type MerchantRole = "owner" | "staff";

/** 로그인 후 리디렉트용 경로 검증(`/m/*` 만 허용). */
export function sanitizeMerchantNextPath(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s.startsWith("/m")) return null;
  if (s.startsWith("//") || s.includes("://")) return null;
  if (s === "/m/login" || s.startsWith("/m/login?")) return "/m";
  return s;
}

export function merchantLoginUrl(nextPath?: string | null): string {
  const next = sanitizeMerchantNextPath(nextPath);
  if (next) return `/m/login?next=${encodeURIComponent(next)}`;
  return "/m/login";
}

export async function requireMerchantForTenant(tenantRaw: string): Promise<{ role: MerchantRole }> {
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

  const { data: row, error: rowErr } = await supabase
    .from("merchant_tenant_members")
    .select("role")
    .eq("tenant_slug", tenant)
    .eq("user_id", user.id)
    .maybeSingle();

  if (rowErr || !row || typeof (row as { role?: unknown }).role !== "string") {
    redirect("/m/forbidden");
  }

  const r = (row as { role: string }).role;
  const role: MerchantRole = r === "staff" ? "staff" : "owner";
  return { role };
}

export async function getMerchantTenantActionAccess(
  formData: FormData,
): Promise<{ userId: string; tenant: string; role: MerchantRole } | null> {
  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  if (!tenant) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const user = await resolveServerUser(supabase);
  if (!user) return null;

  const { data: row, error: rowErr } = await supabase
    .from("merchant_tenant_members")
    .select("role")
    .eq("tenant_slug", tenant)
    .eq("user_id", user.id)
    .maybeSingle();

  if (rowErr || !row || typeof (row as { role?: unknown }).role !== "string") return null;

  const r = (row as { role: string }).role;
  const role: MerchantRole = r === "staff" ? "staff" : "owner";
  return { userId: user.id, tenant, role };
}
