"use server";

import { redirect } from "next/navigation";

import { canDeleteMerchantMenu, canManageMerchantMenus } from "@/lib/merchant/merchant-role-capabilities";
import { requireMerchantOrderMutation } from "@/lib/merchant/require-merchant-action";
import { recordMerchantAuditEvent } from "@/lib/merchant/record-merchant-audit";
import {
  menuTranslationsMapToJson,
  parseTranslationsFromForm,
} from "@/lib/i18n/menu-translations";
import { tryRemoveMenuImageForTenant } from "@/lib/menus/remove-menu-image-from-url";
import { parseMerchantOptionsInput } from "@/lib/menus/menu-options";
import { pickUploadedMenuImageUrl } from "@/lib/menus/upload-menu-image";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

const MAX_NAME = 200;
const MAX_CAT = 120;
const MAX_DESC = 2000;
const MAX_URL = 2000;

function redirectMenus(
  tenant: string,
  err?: string,
  preserveCategory?: string | null,
  ok?: string,
  warn?: string,
  hint?: string,
): never {
  const q = new URLSearchParams();
  if (err) q.set("e", err);
  if (ok) q.set("ok", ok);
  if (warn) q.set("warn", warn.slice(0, 200));
  if (hint) q.set("hint", hint.slice(0, 300));
  const cat = preserveCategory?.trim();
  if (cat) q.set("category", cat.slice(0, MAX_CAT));
  const suffix = q.toString() ? `?${q}` : "";
  redirect(`/m/${encodeURIComponent(tenant)}/menus${suffix}`);
}

function formHasNewImageFile(formData: FormData): boolean {
  const raw = formData.get("file");
  if (raw == null || typeof raw === "string") return false;
  return (raw as File).size > 0;
}

function parseOptionsFromForm(formData: FormData): ReturnType<typeof parseMerchantOptionsInput> {
  const raw = formData.get("options_json");
  const text = raw == null ? "" : String(raw);
  return parseMerchantOptionsInput(text);
}

function readPreserveCategory(formData: FormData): string | null {
  return trimStr(formData.get("preserve_category"), MAX_CAT);
}

function parseSoldOutCheckbox(raw: FormDataEntryValue | null): boolean {
  if (raw == null) return false;
  const s = String(raw).trim();
  return s === "on" || s === "true" || s === "1";
}

async function requireMenusEditor(formData: FormData): Promise<string> {
  const { role, userId } = await requireMerchantOrderMutation(formData);
  if (!canManageMerchantMenus(role)) {
    const tenant = String(formData.get("tenant_slug") ?? "").trim();
    redirect(`/m/${encodeURIComponent(tenant || "_")}/dashboard?e=no_menus_access`);
  }
  return userId;
}

async function requireMenusOwnerForDelete(formData: FormData): Promise<string> {
  const { role, userId } = await requireMerchantOrderMutation(formData);
  if (!canManageMerchantMenus(role)) {
    const tenant = String(formData.get("tenant_slug") ?? "").trim();
    redirect(`/m/${encodeURIComponent(tenant || "_")}/dashboard?e=no_menus_access`);
  }
  if (!canDeleteMerchantMenu(role)) {
    const tenant = String(formData.get("tenant_slug") ?? "").trim();
    const preserveCategory = readPreserveCategory(formData);
    redirectMenus(tenant || "_", "owner_only_delete", preserveCategory);
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
  const actorUserId = await requireMenusEditor(formData);

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const name = trimStr(formData.get("name"), MAX_NAME);
  const price = parsePrice(formData.get("price"));
  if (!tenant || !name || price == null) redirectMenus(tenant || "_", "bad_input");
  const preserveCategory = readPreserveCategory(formData);

  const client = createServiceSupabase();
  if (!client) redirectMenus(tenant, "no_service", preserveCategory);

  const optionsParsed = parseOptionsFromForm(formData);
  if (!optionsParsed.ok) {
    redirectMenus(tenant, "bad_options", preserveCategory, undefined, undefined, optionsParsed.message);
  }

  let uploadWarn: string | undefined;
  let imageUrl = trimStr(formData.get("imageUrl"), MAX_URL);
  if (formHasNewImageFile(formData)) {
    const upload = await pickUploadedMenuImageUrl(client, formData, tenant);
    if (upload.ok && upload.url) {
      imageUrl = upload.url;
    } else if (!upload.ok) {
      uploadWarn = upload.message;
    }
  }

  const rawSort = formData.get("sort_order");
  const sort_order =
    rawSort == null || String(rawSort).trim() === ""
      ? await nextSortOrder(client, tenant)
      : parseSortOrder(rawSort);

  const is_sold_out = parseSoldOutCheckbox(formData.get("is_sold_out"));
  const translations_json = menuTranslationsMapToJson(parseTranslationsFromForm(formData));

  const { error } = await client.from("ChayaMenus").insert({
    tenant_slug: tenant,
    name,
    price,
    category: trimStr(formData.get("category"), MAX_CAT),
    description: trimStr(formData.get("description"), MAX_DESC),
    imageUrl,
    sort_order,
    is_sold_out,
    options_json: optionsParsed.value,
    translations_json,
  });

  if (error) redirectMenus(tenant, "db", preserveCategory);
  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId,
    action: "menu_create",
    detail: { name },
  });
  redirectMenus(tenant, undefined, preserveCategory, "saved", uploadWarn);
}

export async function updateMenuFromForm(formData: FormData): Promise<void> {
  const actorUserId = await requireMenusEditor(formData);

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
    .select("imageUrl, options_json")
    .eq("id", menuId)
    .eq("tenant_slug", tenant)
    .maybeSingle();

  const prevUrl =
    existing && typeof existing === "object" && "imageUrl" in existing
      ? (existing as { imageUrl?: string | null }).imageUrl
      : null;

  const existingOptionsJson =
    existing && typeof existing === "object" && "options_json" in existing
      ? (existing as { options_json?: unknown }).options_json
      : null;

  const optionsParsed = parseOptionsFromForm(formData);
  let options_json: unknown = null;
  let uploadWarn: string | undefined;
  if (optionsParsed.ok) {
    options_json = optionsParsed.value;
  } else {
    options_json = existingOptionsJson ?? null;
    const optRaw = String(formData.get("options_json") ?? "").trim();
    if (optRaw) {
      uploadWarn = `옵션은 이전 값을 유지했습니다. (${optionsParsed.message})`;
    }
  }

  let imageUrl = trimStr(formData.get("imageUrl"), MAX_URL) ?? prevUrl;
  if (formHasNewImageFile(formData)) {
    const upload = await pickUploadedMenuImageUrl(client, formData, tenant);
    if (upload.ok && upload.url) {
      imageUrl = upload.url;
    } else if (!upload.ok) {
      uploadWarn = upload.message;
      imageUrl = prevUrl;
    }
  }

  const sort_order = parseSortOrder(formData.get("sort_order"));
  const is_sold_out = parseSoldOutCheckbox(formData.get("is_sold_out"));
  const translations_json = menuTranslationsMapToJson(parseTranslationsFromForm(formData));

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
      options_json,
      translations_json,
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
  redirectMenus(tenant, undefined, preserveCategory, "saved", uploadWarn);
}

/** 메뉴 사진만 업로드·저장 (옵션·가격 검증 없음). */
export async function uploadMenuImageOnlyFromForm(formData: FormData): Promise<void> {
  const actorUserId = await requireMenusEditor(formData);

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const menuId = String(formData.get("menu_id") ?? "").trim();
  const preserveCategory = readPreserveCategory(formData);

  if (!tenant || !menuId || !UUID_RE.test(menuId)) {
    redirectMenus(tenant || "_", "bad_input", preserveCategory);
  }
  if (!formHasNewImageFile(formData)) {
    redirectMenus(
      tenant,
      "bad_input",
      preserveCategory,
      undefined,
      undefined,
      "사진 파일을 선택한 뒤 「사진만 저장」을 눌러 주세요.",
    );
  }

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

  const upload = await pickUploadedMenuImageUrl(client, formData, tenant);
  if (!upload.ok) {
    redirectMenus(tenant, "upload", preserveCategory, undefined, undefined, upload.message);
  }
  if (!upload.url) {
    redirectMenus(
      tenant,
      "bad_input",
      preserveCategory,
      undefined,
      undefined,
      "업로드할 파일이 비어 있습니다.",
    );
  }

  const { error } = await client
    .from("ChayaMenus")
    .update({ imageUrl: upload.url })
    .eq("id", menuId)
    .eq("tenant_slug", tenant);

  if (error) redirectMenus(tenant, "db", preserveCategory);

  if (prevUrl && prevUrl !== upload.url) {
    await tryRemoveMenuImageForTenant(client, tenant, prevUrl);
  }

  void recordMerchantAuditEvent({
    tenantSlug: tenant,
    actorUserId,
    action: "menu_image_upload",
    detail: { menu_id: menuId },
  });
  redirectMenus(tenant, undefined, preserveCategory, "image_saved");
}

export async function setMenuSoldOutFromForm(formData: FormData): Promise<void> {
  const actorUserId = await requireMenusEditor(formData);

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
  const actorUserId = await requireMenusOwnerForDelete(formData);

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
