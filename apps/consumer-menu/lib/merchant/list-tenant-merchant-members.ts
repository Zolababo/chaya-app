import "server-only";

import type { MerchantRole } from "@/lib/merchant/merchant-access";
import { merchantRoleBadgeKo } from "@/lib/merchant/merchant-role-capabilities";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { withSupabaseReadRetry } from "@/lib/supabase/transient-retry";

export type TenantMerchantMemberRow = {
  id: string;
  role: MerchantRole;
  roleLabel: string;
  createdAt: string;
  approvedAt: string | null;
  inviteEmail: string | null;
};

export type ListTenantMerchantMembersResult =
  | { ok: true; members: TenantMerchantMemberRow[] }
  | { ok: false; message: string };

function parseRole(raw: unknown): MerchantRole | null {
  const r = typeof raw === "string" ? raw.trim() : "";
  if (
    r === "owner" ||
    r === "staff" ||
    r === "menu_editor" ||
    r === "viewer" ||
    r === "finance"
  ) {
    return r;
  }
  return null;
}

export async function listTenantMerchantMembers(
  tenantSlug: string,
): Promise<ListTenantMerchantMembersResult> {
  const tenant = tenantSlug.trim();
  if (!tenant) {
    return { ok: false, message: "매장 정보가 없습니다." };
  }

  const client = createServiceSupabase();
  if (!client) {
    return { ok: false, message: "서버 설정이 없습니다." };
  }

  const { data, error } = await withSupabaseReadRetry(() =>
    client
      .from("merchant_tenant_members")
      .select("id, role, created_at, approved_at, invite_email")
      .eq("tenant_slug", tenant)
      .order("created_at", { ascending: true }),
  );

  if (error) {
    return { ok: false, message: error.message ?? "직원 목록을 불러오지 못했습니다." };
  }

  const members: TenantMerchantMemberRow[] = [];
  for (const row of data ?? []) {
    const rec = row as {
      id?: unknown;
      role?: unknown;
      created_at?: unknown;
      approved_at?: unknown;
      invite_email?: unknown;
    };
    const role = parseRole(rec.role);
    if (!role || typeof rec.id !== "string") continue;
    members.push({
      id: rec.id,
      role,
      roleLabel: merchantRoleBadgeKo(role),
      createdAt: typeof rec.created_at === "string" ? rec.created_at : "",
      approvedAt: typeof rec.approved_at === "string" ? rec.approved_at : null,
      inviteEmail: typeof rec.invite_email === "string" ? rec.invite_email : null,
    });
  }

  return { ok: true, members };
}
