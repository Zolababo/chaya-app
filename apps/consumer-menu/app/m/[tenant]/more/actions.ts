"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getMerchantTenantActionAccess } from "@/lib/merchant/merchant-access";
import {
  canManageMerchantHours,
  canManageMerchantStoreProfile,
} from "@/lib/merchant/merchant-role-capabilities";
import { recordMerchantAuditEvent } from "@/lib/merchant/record-merchant-audit";
import { pickUploadedMenuImageUrl } from "@/lib/menus/upload-menu-image";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

const MAX_NAME = 80;
const MAX_URL = 2048;

function moreUrl(tenant: string, section: "store" | "hours", query?: Record<string, string>): never {
  const t = encodeURIComponent(tenant);
  const base = `/m/${t}/more/${section}`;
  if (!query || Object.keys(query).length === 0) redirect(base);
  const sp = new URLSearchParams(query);
  redirect(`${base}?${sp.toString()}`);
}

function trim(raw: FormDataEntryValue | null, max: number): string {
  return String(raw ?? "").trim().slice(0, max);
}

function parseHm(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  return /^\d{2}:\d{2}$/.test(v) ? v : null;
}

async function upsertSettings(
  tenant: string,
  patch: Record<string, unknown>,
  actorUserId: string,
  auditAction: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const client = createServiceSupabase();
  if (!client) return { ok: false, code: "no_service" };

  const { error } = await client.from("tenant_store_settings").upsert(
    {
      tenant_slug: tenant,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_slug" },
  );

  if (error) {
    console.error("[merchant-more-actions]", error.code ?? "", error.message);
    return { ok: false, code: "db" };
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId,
    action: auditAction,
    detail: patch,
  });

  return { ok: true };
}

export async function updateMerchantStoreProfileFromForm(formData: FormData): Promise<void> {
  const access = await getMerchantTenantActionAccess(formData);
  if (!access || !canManageMerchantStoreProfile(access.role)) {
    moreUrl(String(formData.get("tenant_slug") ?? ""), "store", { e: "forbidden" });
  }

  const display_name = trim(formData.get("display_name"), MAX_NAME);
  let logo_url = trim(formData.get("logo_url"), MAX_URL);
  const clearLogo = formData.get("clear_logo") === "1";

  const client = createServiceSupabase();
  if (!client) {
    moreUrl(access.tenant, "store", { e: "no_service" });
  }

  const logoFile = formData.get("logo_file");
  if (logoFile instanceof File && logoFile.size > 0) {
    const proxy = new FormData();
    proxy.set("file", logoFile);
    const uploaded = await pickUploadedMenuImageUrl(client, proxy, access.tenant);
    if (!uploaded.ok) {
      const detail = encodeURIComponent(uploaded.message.slice(0, 120));
      moreUrl(access.tenant, "store", { e: "logo_upload", d: detail });
    }
    if (uploaded.url) logo_url = uploaded.url;
  } else if (clearLogo) {
    logo_url = "";
  }

  const result = await upsertSettings(
    access.tenant,
    {
      display_name: display_name || null,
      logo_url: logo_url || null,
    },
    access.userId,
    "store_profile_update",
  );

  if (!result.ok) {
    moreUrl(access.tenant, "store", { e: result.code });
  }
  moreUrl(access.tenant, "store", { ok: "saved" });
}

export async function updateMerchantHoursFromForm(formData: FormData): Promise<void> {
  const access = await getMerchantTenantActionAccess(formData);
  if (!access || !canManageMerchantHours(access.role)) {
    moreUrl(String(formData.get("tenant_slug") ?? ""), "hours", { e: "forbidden" });
  }

  const orders_accepting = formData.get("orders_accepting") === "on";
  const break_start = parseHm(trim(formData.get("break_start"), 5));
  const break_end = parseHm(trim(formData.get("break_end"), 5));

  const result = await upsertSettings(
    access.tenant,
    {
      orders_accepting,
      break_start,
      break_end,
    },
    access.userId,
    "store_hours_update",
  );

  if (!result.ok) {
    moreUrl(access.tenant, "hours", { e: result.code });
  }
  moreUrl(access.tenant, "hours", { ok: "saved" });
}

/** 설정 바텀시트 — 페이지 이동 없이 영업 상태만 변경 */
export async function toggleMerchantOrdersAcceptingInline(
  formData: FormData,
): Promise<{ ok: true; accepting: boolean } | { ok: false; code: string }> {
  const access = await getMerchantTenantActionAccess(formData);
  if (!access || !canManageMerchantHours(access.role)) {
    return { ok: false, code: "forbidden" };
  }

  const next = formData.get("next_accepting") === "true";
  const result = await upsertSettings(
    access.tenant,
    { orders_accepting: next },
    access.userId,
    next ? "orders_accepting_on" : "orders_accepting_off",
  );

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  revalidatePath(`/m/${encodeURIComponent(access.tenant)}`, "layout");
  return { ok: true, accepting: next };
}

/** 설정 바텀시트 — 브레이크타임만 저장 (영업 상태 유지) */
export async function updateMerchantBreakTimeInline(
  formData: FormData,
): Promise<
  | { ok: true; breakStart: string | null; breakEnd: string | null }
  | { ok: false; code: string }
> {
  const access = await getMerchantTenantActionAccess(formData);
  if (!access || !canManageMerchantHours(access.role)) {
    return { ok: false, code: "forbidden" };
  }

  const break_start = parseHm(trim(formData.get("break_start"), 5));
  const break_end = parseHm(trim(formData.get("break_end"), 5));

  if ((break_start && !break_end) || (!break_start && break_end)) {
    return { ok: false, code: "invalid_break" };
  }

  const result = await upsertSettings(
    access.tenant,
    { break_start, break_end },
    access.userId,
    "store_break_update",
  );

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  revalidatePath(`/m/${encodeURIComponent(access.tenant)}`, "layout");
  return { ok: true, breakStart: break_start, breakEnd: break_end };
}

export async function toggleMerchantOrdersAcceptingFromForm(formData: FormData): Promise<void> {
  const access = await getMerchantTenantActionAccess(formData);
  if (!access || !canManageMerchantHours(access.role)) {
    moreUrl(String(formData.get("tenant_slug") ?? ""), "hours", { e: "forbidden" });
  }

  const next = formData.get("next_accepting") === "true";
  const result = await upsertSettings(
    access.tenant,
    { orders_accepting: next },
    access.userId,
    next ? "orders_accepting_on" : "orders_accepting_off",
  );

  if (!result.ok) {
    moreUrl(access.tenant, "hours", { e: result.code });
  }
  moreUrl(access.tenant, "hours", { ok: next ? "open" : "closed" });
}
