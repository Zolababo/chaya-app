"use server";

import { redirect } from "next/navigation";

import { requireMerchantOrderMutation } from "@/lib/merchant/require-merchant-action";
import { recordMerchantAuditEvent } from "@/lib/merchant/record-merchant-audit";
import { tryRemoveMenuImageForTenant } from "@/lib/menus/remove-menu-image-from-url";
import { pickUploadedMenuImageUrl } from "@/lib/menus/upload-menu-image";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

const MAX_NAME = 200;
const MAX_CAT = 120;
const MAX_DESC = 2000;
const MAX_URL = 2000;

function redirectMenus(tenant: string, err?: string, preserveCategory?: string | null): never {
  const q = new URLSearchParams();
  if (err) q.set("e", err);
  const cat = preserveCategory?.trim();
  if (cat) q.set("category", cat.slice(0, MAX_CAT));
  const suffix = q.toString() ? `?${q}` : "";
  redirect(`/m/${encodeURIComponent(tenant)}/menus${suffix}`);
}

function readPreserveCategory(formData: FormData): string | null {
  return trimStr(formData.get("preserve_category"), MAX_CAT);
}

function parseSoldOutCheckbox(raw: FormDataEntryValue | null): boolean {
  if (raw == null) return false;
  const s = String(raw).trim();
  return s === "on" || s === "true" || s === "1";
}

async function requireMenusOwner(formData: FormData): Promise<string> {
  const { role, userId } = await requireMerchantOrderMutation(formData);
  if (role !== "owner") {
    const tenant = String(formData.get("tenant_slug") ?? "").trim();
    redirect(`/m/${encodeURIComponent(tenant || "_")}/dashboard?e=no_menus_access`);
  }
  return userId;
}

function parsePrice(raw: FormDataEntryValue | null): number | null {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/,/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 100_000_000 ? n : null;
}

function trimStr(raw: FormDataEntryValue | null, max: number): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().slice(0, max);
  return s ? s : null;
}

const MAX_SORT = 2_000_000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseSortOrder(raw: FormDataEntryValue | null): number {
  if (raw == null) return 0;
  const s = String(raw).trim();
  if (!s) return 0;
  const n = Math.trunc(Number(s));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(n, MAX_SORT));
}

async function nextSortOrder(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  tenant: string,
): Promise<number> {
  const { data, error } = await client
    .from("ChayaMenus")
    .select("sort_order")
    .eq("tenant_slug", tenant)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (error || !data?.length) return 0;
  const row = data[0] as { sort_order?: number };
  const v = row.sort_order;
  return typeof v === "number" && Number.isFinite(v) ? v + 1 : 0;
}

export async function createMenuFromForm(formData: FormData): Promise<void> {
  const actorUserId = await requireMenusOwner(formData);

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const name = trimStr(formData.get("name"), MAX_NAME);
  const price = parsePrice(formData.get("price"));
  if (!tenant || !name || price == null) redirectMenus(tenant || "_", "bad_input");
  const preserveCategory = readPreserveCategory(formData);

  const client = createServiceSupabase();
  if (!client) redirectMenus(tenant, "no_service", preserveCategory);

  const upload = await pickUploadedMenuImageUrl(client, formData, tenant);
  if (!upload.ok) redirectMenus(tenant, "upload", preserveCategory);
  const imageUrl = upload.url ?? trimStr(formData.get("imageUrl"), MAX_URL);

  const rawSort = formData.get("sort_order");
  const sort_order =
    rawSort == null || String(rawSort).trim() === ""
      ? await nextSortOrder(client, tenant)
      : parseSortOrder(rawSort);

  const is_sold_out = parseSoldOutCheckbox(formData.get("is_sold_out"));

  const { error } = await client.from("ChayaMenus").insert({
    tenant_slug: tenant,
    name,
    price,
    category: trimStr(formData.get("category"), MAX_CAT),
    description: trimStr(formData.get("description"), MAX_DESC),
    imageUrl,
    sort_order,
    is_sold_out,
  });

  if (error) redirectMenus(tenant, "db", preserveCategory);
  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId,
    action: "menu_create",
    detail: { name },
  });
  redirectMenus(tenant, undefined, preserveCategory);
}

export async function updateMenuFromForm(formData: FormData): Promise<void> {
  const actorUserId = await requireMenusOwner(formData);

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const menuId = String(formData.get("menu_id") ?? "").trim();
  const name = trimStr(formData.get("name"), MAX_NAME);
  const price = parsePrice(formData.get("price"));
  if (!tenant || !menuId || !UUID_RE.test(menuId) || !name || price == null) {
    redirectMenus(tenant || "_", "bad_input");
  }
  const preserveCategory = readPreserveCategory(formData);

  const client = createServiceSupabase();
  if (!client) redirectMenus(tenant, "no_service", preserveCategory);

  const { data: existing } = await client
    .from("ChayaMenus")
    .select("imageUrl")
    .eq("id", menuId)
    .eq("tenant_slug", tenant)
    .maybeSingle();

  const upload = await pickUploadedMenuImageUrl(client, formData, tenant);
  if (!upload.ok) redirectMenus(tenant, "upload", preserveCategory);
  const imageUrl = upload.url ?? trimStr(formData.get("imageUrl"), MAX_URL);
  const sort_order = parseSortOrder(formData.get("sort_order"));
  const is_sold_out = parseSoldOutCheckbox(formData.get("is_sold_out"));

  const prevUrl =
    existing && typeof existing === "object" && "imageUrl" in existing
      ? (existing as { imageUrl?: string | null }).imageUrl
      : null;

  const { error } = await client
    .from("ChayaMenus")
    .update({
      name,
      price,
      category: trimStr(formData.get("category"), MAX_CAT),
      description: trimStr(formData.get("description"), MAX_DESC),
      imageUrl,
      sort_order,
      is_sold_out,
    })
    .eq("id", menuId)
    .eq("tenant_slug", tenant);

  if (error) redirectMenus(tenant, "db", preserveCategory);

  if (prevUrl && prevUrl !== imageUrl) {
    await tryRemoveMenuImageForTenant(client, tenant, prevUrl);
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId,
    action: "menu_update",
    detail: { menu_id: menuId, name },
  });
  redirectMenus(tenant, undefined, preserveCategory);
}

export async function setMenuSoldOutFromForm(formData: FormData): Promise<void> {
  const actorUserId = await requireMenusOwner(formData);

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const menuId = String(formData.get("menu_id") ?? "").trim();
  const preserveCategory = readPreserveCategory(formData);
  const raw = formData.get("is_sold_out");
  const is_sold_out = raw === "true" || raw === "1" || raw === "on";

  if (!tenant || !menuId || !UUID_RE.test(menuId)) redirectMenus(tenant || "_", "bad_input");

  const client = createServiceSupabase();
  if (!client) redirectMenus(tenant, "no_service", preserveCategory);

  const { error } = await client
    .from("ChayaMenus")
    .update({ is_sold_out })
    .eq("id", menuId)
    .eq("tenant_slug", tenant);

  if (error) redirectMenus(tenant, "db", preserveCategory);
  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId,
    action: "menu_sold_out_toggle",
    detail: { menu_id: menuId, is_sold_out },
  });
  redirectMenus(tenant, undefined, preserveCategory);
}

export async function deleteMenuFromForm(formData: FormData): Promise<void> {
  const actorUserId = await requireMenusOwner(formData);

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const menuId = String(formData.get("menu_id") ?? "").trim();
  if (!tenant || !menuId || !UUID_RE.test(menuId)) redirectMenus(tenant || "_", "bad_input");
  const preserveCategory = readPreserveCategory(formData);

  const client = createServiceSupabase();
  if (!client) redirectMenus(tenant, "no_service", preserveCategory);

  const { data: existing } = await client
    .from("ChayaMenus")
    .select("imageUrl")
    .eq("id", menuId)
    .eq("tenant_slug", tenant)
    .maybeSingle();

  const prevUrl =
    existing && typeof existing === "object" && "imageUrl" in existing
      ? (existing as { imageUrl?: string | null }).imageUrl
      : null;

  const { error } = await client.from("ChayaMenus").delete().eq("id", menuId).eq("tenant_slug", tenant);

  if (error) redirectMenus(tenant, "db", preserveCategory);

  await tryRemoveMenuImageForTenant(client, tenant, prevUrl);

  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId,
    action: "menu_delete",
    detail: { menu_id: menuId },
  });
  redirectMenus(tenant, undefined, preserveCategory);
}
