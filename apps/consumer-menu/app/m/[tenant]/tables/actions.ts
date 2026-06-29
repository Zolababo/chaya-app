"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageTenantTables } from "@/lib/merchant/merchant-role-capabilities";
import { recordMerchantAuditEvent } from "@/lib/merchant/record-merchant-audit";
import { requireMerchantOrderMutation } from "@/lib/merchant/require-merchant-action";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { normalizeTableCode } from "@/lib/tables/tenant-table-code";

const MAX_LABEL = 80;
const MAX_BULK = 50;

function redirectTables(
  tenant: string,
  err?: string,
  ok?: string,
  focus?: string,
  detail?: string,
): never {
  const q = new URLSearchParams();
  if (err) q.set("e", err);
  if (ok) q.set("ok", ok);
  if (focus?.trim()) q.set("focus", focus.trim());
  if (detail?.trim()) q.set("d", detail.trim().slice(0, 120));
  const suffix = q.toString() ? `?${q}` : "";
  redirect(`/m/${encodeURIComponent(tenant)}/tables${suffix}`);
}

async function requireTablesEditor(formData: FormData): Promise<{ tenant: string; userId: string }> {
  const { role, userId } = await requireMerchantOrderMutation(formData);
  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  if (!canManageTenantTables(role)) {
    redirect(`/m/${encodeURIComponent(tenant || "_")}/tables?e=no_table_access`);
  }
  return { tenant, userId };
}

function trimLabel(raw: FormDataEntryValue | null): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().slice(0, MAX_LABEL);
  return s || null;
}

export async function addTenantTableAction(formData: FormData): Promise<void> {
  const { tenant, userId } = await requireTablesEditor(formData);
  const norm = normalizeTableCode(String(formData.get("table_code") ?? ""));
  if (!norm.ok) {
    redirectTables(tenant, "table_code_format");
  }
  const label = trimLabel(formData.get("label"));
  const sortRaw = formData.get("sort_order");
  const sort_order =
    sortRaw == null || String(sortRaw).trim() === ""
      ? 0
      : Math.max(0, Math.min(2_000_000, Math.trunc(Number(sortRaw)) || 0));

  const client = createServiceSupabase();
  if (!client) redirectTables(tenant, "no_service");

  const { error } = await client.from("tenant_tables").insert({
    tenant_slug: tenant,
    table_code: norm.code,
    label,
    sort_order,
    is_active: true,
  });

  if (error) {
    if (error.code === "23505") redirectTables(tenant, "table_duplicate", undefined, undefined, norm.code);
    console.error("[addTenantTable]", error.code, error.message);
    redirectTables(tenant, "save_failed");
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId: userId,
    action: "tenant_table.add",
    detail: { table_code: norm.code },
  });
  revalidatePath(`/m/${tenant}/tables`);
  redirectTables(tenant, undefined, "added", norm.code);
}

export async function bulkAddTenantTablesAction(formData: FormData): Promise<void> {
  const { tenant, userId } = await requireTablesEditor(formData);
  const from = Math.max(1, Math.trunc(Number(formData.get("from_no")) || 1));
  const to = Math.max(from, Math.trunc(Number(formData.get("to_no")) || from));
  if (to - from + 1 > MAX_BULK) redirectTables(tenant, "bulk_too_many");

  const client = createServiceSupabase();
  if (!client) redirectTables(tenant, "no_service");

  const rows: { tenant_slug: string; table_code: string; sort_order: number; is_active: boolean }[] =
    [];
  for (let n = from; n <= to; n++) {
    const norm = normalizeTableCode(String(n));
    if (!norm.ok) redirectTables(tenant, "table_code_format");
    rows.push({ tenant_slug: tenant, table_code: norm.code, sort_order: n, is_active: true });
  }

  const codes = rows.map((r) => r.table_code);
  const { data: existingRows } = await client
    .from("tenant_tables")
    .select("table_code")
    .eq("tenant_slug", tenant)
    .in("table_code", codes);

  const dupes = (existingRows ?? [])
    .map((r) => (r as { table_code?: string }).table_code?.trim())
    .filter((c): c is string => Boolean(c));

  if (dupes.length > 0) {
    redirectTables(tenant, "bulk_duplicate", undefined, undefined, dupes.join(","));
  }

  const { error } = await client.from("tenant_tables").insert(rows);

  if (error) {
    if (error.code === "23505") {
      redirectTables(tenant, "bulk_duplicate", undefined, undefined, codes.join(","));
    }
    console.error("[bulkAddTenantTables]", error.code, error.message);
    redirectTables(tenant, "save_failed");
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId: userId,
    action: "tenant_table.bulk_add",
    detail: { from, to, count: rows.length },
  });
  revalidatePath(`/m/${tenant}/tables`);
  redirectTables(tenant, undefined, "bulk_added");
}

export async function setTenantTableActiveAction(formData: FormData): Promise<void> {
  const { tenant, userId } = await requireTablesEditor(formData);
  const id = String(formData.get("id") ?? "").trim();
  const active = String(formData.get("is_active") ?? "") === "1";
  if (!id) redirectTables(tenant, "invalid_id");

  const client = createServiceSupabase();
  if (!client) redirectTables(tenant, "no_service");

  const { error } = await client
    .from("tenant_tables")
    .update({ is_active: active })
    .eq("tenant_slug", tenant)
    .eq("id", id);

  if (error) {
    console.error("[setTenantTableActive]", error.code, error.message);
    redirectTables(tenant, "save_failed");
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId: userId,
    action: active ? "tenant_table.activate" : "tenant_table.deactivate",
    detail: { id },
  });
  redirectTables(tenant, undefined, active ? "activated" : "deactivated");
}

export async function deleteTenantTableAction(formData: FormData): Promise<void> {
  const { tenant, userId } = await requireTablesEditor(formData);
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirectTables(tenant, "invalid_id");

  const client = createServiceSupabase();
  if (!client) redirectTables(tenant, "no_service");

  const { error } = await client.from("tenant_tables").delete().eq("tenant_slug", tenant).eq("id", id);

  if (error) {
    console.error("[deleteTenantTable]", error.code, error.message);
    redirectTables(tenant, "save_failed");
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId: userId,
    action: "tenant_table.delete",
    detail: { id },
  });
  redirectTables(tenant, undefined, "deleted");
}
