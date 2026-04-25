import type { SupabaseClient } from "@supabase/supabase-js";

import { folderSafeTenant } from "./storage-tenant-folder";

function menuImagesBucket(): string {
  return process.env.SUPABASE_MENU_IMAGES_BUCKET?.trim() || "menu-images";
}

/**
 * 공개 URL에서 `bucket` 이후 객체 경로만 추출합니다.
 * `/storage/v1/object/public/{bucket}/` 뒤를 사용합니다.
 */
function objectPathFromPublicUrl(imageUrl: string, bucket: string): string | null {
  const u = imageUrl.trim();
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = u.indexOf(marker);
  if (i === -1) return null;
  let path = u.slice(i + marker.length);
  path = path.split("?")[0] ?? path;
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (!path || path.includes("..")) return null;
  return path;
}

/**
 * 이 테넌트 폴더 아래 업로드된 객체일 때만 삭제합니다. 실패해도 예외를 던지지 않습니다.
 */
export async function tryRemoveMenuImageForTenant(
  client: SupabaseClient,
  tenantSlug: string,
  imageUrl: string | null | undefined,
): Promise<void> {
  const raw = imageUrl?.trim();
  if (!raw) return;

  const bucket = menuImagesBucket();
  const path = objectPathFromPublicUrl(raw, bucket);
  if (!path) return;

  const prefix = `${folderSafeTenant(tenantSlug)}/`;
  if (!path.startsWith(prefix)) {
    return;
  }

  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) {
    console.error("[tryRemoveMenuImageForTenant]", error.message);
  }
}
