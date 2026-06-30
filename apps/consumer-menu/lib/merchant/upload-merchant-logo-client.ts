/** 매장 로고 — 선택 즉시 Route Handler 업로드 (server action 6MB·모바일 FormData 이슈 회피) */

import { buildMerchantImageUploadPayload } from "@/lib/merchant/build-merchant-image-upload-payload";

const UPLOAD_TIMEOUT_MS = 30_000;

export async function uploadMerchantLogoFile(
  tenant: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  let payload: File;
  try {
    payload = await buildMerchantImageUploadPayload(file);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "사진을 준비하지 못했습니다.";
    return { ok: false, message: msg };
  }

  const fd = new FormData();
  fd.set("file", payload, payload.name || "logo.jpg");

  let res: Response;
  try {
    res = await fetch(`/m/${encodeURIComponent(tenant)}/more/store/logo-upload`, {
      method: "POST",
      body: fd,
      credentials: "same-origin",
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return { ok: false, message: "업로드 시간이 초과됐어요. 잠시 후 다시 시도해 주세요." };
    }
    return { ok: false, message: "사진을 올리지 못했어요. 네트워크를 확인해 주세요." };
  }

  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; url?: string; message?: string }
    | null;

  if (!res.ok || !json?.ok || !json.url) {
    const fallback =
      res.status === 413 ?
        "사진 용량은 3MB 이하여야 합니다. 다른 사진을 선택해 주세요."
      : (json?.message ?? "사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요.");
    return { ok: false, message: fallback };
  }

  return { ok: true, url: json.url };
}
