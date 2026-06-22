import { buildMerchantImageUploadPayload } from "@/lib/merchant/build-merchant-image-upload-payload";

type UploadOk = { ok: true; url: string };
type UploadErr = { ok: false; message: string };

async function postMenuImage(
  tenant: string,
  file: File,
  menuId?: string,
): Promise<UploadOk | UploadErr> {
  let payload: File;
  try {
    payload = await buildMerchantImageUploadPayload(file);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "사진을 준비하지 못했습니다.";
    return { ok: false, message: msg };
  }

  const fd = new FormData();
  fd.set("file", payload, payload.name || "menu.jpg");

  const tEnc = encodeURIComponent(tenant);
  const url = menuId
    ? `/m/${tEnc}/menus/${encodeURIComponent(menuId)}/image-upload`
    : `/m/${tEnc}/menus/image-upload`;

  const res = await fetch(url, {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });

  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; url?: string; message?: string }
    | null;

  if (!res.ok || !json?.ok || !json.url) {
    return {
      ok: false,
      message: json?.message ?? "사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { ok: true, url: json.url };
}

/** 메뉴 추가 — Storage만 (메뉴 row 생성 전) */
export function uploadMerchantMenuImageStaging(tenant: string, file: File) {
  return postMenuImage(tenant, file);
}

/** 메뉴 수정 — Storage + imageUrl 저장 */
export function uploadMerchantMenuImageFile(tenant: string, menuId: string, file: File) {
  return postMenuImage(tenant, file, menuId);
}
