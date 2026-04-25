"use server";

import { redirect } from "next/navigation";

import { getMerchantTokenForAction } from "@/lib/merchant/get-merchant-token-for-action";
import { pickUploadedMenuImageUrl } from "@/lib/menus/upload-menu-image";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

const MAX_NAME = 200;
const MAX_CAT = 120;
const MAX_DESC = 2000;
const MAX_URL = 2000;

function redirectMenus(tenant: string, err?: string): never {
  const q = new URLSearchParams();
  if (err) q.set("e", err);
  const suffix = q.toString() ? `?${q}` : "";
  redirect(`/m/${encodeURIComponent(tenant)}/menus${suffix}`);
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

export async function createMenuFromForm(formData: FormData): Promise<void> {
  const token = await getMerchantTokenForAction(formData);
  if (!token) redirect("/m/forbidden");

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const name = trimStr(formData.get("name"), MAX_NAME);
  const price = parsePrice(formData.get("price"));
  if (!tenant || !name || price == null) redirectMenus(tenant || "_", "bad_input");

  const client = createServiceSupabase();
  if (!client) redirectMenus(tenant, "no_service");

  const upload = await pickUploadedMenuImageUrl(client, formData, tenant);
  if (!upload.ok) redirectMenus(tenant, "upload");
  const imageUrl = upload.url ?? trimStr(formData.get("imageUrl"), MAX_URL);

  const { error } = await client.from("ChayaMenus").insert({
    tenant_slug: tenant,
    name,
    price,
    category: trimStr(formData.get("category"), MAX_CAT),
    description: trimStr(formData.get("description"), MAX_DESC),
    imageUrl,
  });

  if (error) redirectMenus(tenant, "db");
  redirectMenus(tenant);
}

export async function updateMenuFromForm(formData: FormData): Promise<void> {
  const token = await getMerchantTokenForAction(formData);
  if (!token) redirect("/m/forbidden");

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const menuId = String(formData.get("menu_id") ?? "").trim();
  const name = trimStr(formData.get("name"), MAX_NAME);
  const price = parsePrice(formData.get("price"));
  if (!tenant || !menuId || !name || price == null) redirectMenus(tenant || "_", "bad_input");

  const client = createServiceSupabase();
  if (!client) redirectMenus(tenant, "no_service");

  const upload = await pickUploadedMenuImageUrl(client, formData, tenant);
  if (!upload.ok) redirectMenus(tenant, "upload");
  const imageUrl = upload.url ?? trimStr(formData.get("imageUrl"), MAX_URL);

  const { error } = await client
    .from("ChayaMenus")
    .update({
      name,
      price,
      category: trimStr(formData.get("category"), MAX_CAT),
      description: trimStr(formData.get("description"), MAX_DESC),
      imageUrl,
    })
    .eq("id", menuId)
    .eq("tenant_slug", tenant);

  if (error) redirectMenus(tenant, "db");
  redirectMenus(tenant);
}

export async function deleteMenuFromForm(formData: FormData): Promise<void> {
  const token = await getMerchantTokenForAction(formData);
  if (!token) redirect("/m/forbidden");

  const tenant = String(formData.get("tenant_slug") ?? "").trim();
  const menuId = String(formData.get("menu_id") ?? "").trim();
  if (!tenant || !menuId) redirectMenus(tenant || "_", "bad_input");

  const client = createServiceSupabase();
  if (!client) redirectMenus(tenant, "no_service");

  const { error } = await client.from("ChayaMenus").delete().eq("id", menuId).eq("tenant_slug", tenant);

  if (error) redirectMenus(tenant, "db");
  redirectMenus(tenant);
}
